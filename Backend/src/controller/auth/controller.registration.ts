import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { newLoginTokens, refreshCookieOptions } from "./controller.active.js";
import type { Role } from "../../generated/prisma/enums.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";
import { prisma } from "../../main.js";
import otpGenerator from "../../utils/utils.api.otp.js";
import redisClient from "../../services/redis/service.redis.js";
import sendMail from "./controller.google.js";


// helper function

const hashingPassword = async (password: string) => {
    console.log("[AUTH:hashingPassword] Step 1: Hashing password using bcrypt with salt rounds 10...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[AUTH:hashingPassword] Step 2: Password successfully hashed.");
    return hashedPassword;
};

const registerUser = async (name: string, email: string, role: Role, passwordOrHash: string, isAlreadyHashed: boolean = false) => {
    console.log("[AUTH:registerUser] Step 1: registerUser called for email:", email, "with role:", role);
    try {
        console.log("[AUTH:registerUser] Step 2: Validating required fields (name, email, password)...");
        if ([name, email, passwordOrHash].some(field => !field || field.trim() === "")) {
            console.error("[AUTH:registerUser] Validation failed: missing required user fields");
            throw new ApiError(400, "All Fields are Required");
        }

        console.log("[AUTH:registerUser] Step 3: Checking if email already exists in database:", email);
        if (await prisma.user.findFirst({ where: { email } })) {
            console.error("[AUTH:registerUser] Conflict: user with email already exists:", email);
            throw new ApiError(400, "Email already exists");
        }

        console.log("[AUTH:registerUser] Step 4: Resolving password hash (isAlreadyHashed:", isAlreadyHashed, ")...");
        const hashedPassword = isAlreadyHashed ? passwordOrHash : await hashingPassword(passwordOrHash);

        console.log("[AUTH:registerUser] Step 5: Creating user record in database...");
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                role,
                passwordHash: hashedPassword,
            }
        });
        console.log("[AUTH:registerUser] Step 6: User record created. Querying safe user projection for id:", newUser.id);
        const createdUser = await prisma.user.findUnique({
            where: { id: newUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                organisationId: true,
            }
        });
        console.log("[AUTH:registerUser] Step 7: User registration in database completed successfully.");
        return createdUser;
    } catch (error) {
        console.error("[AUTH:registerUser] registerUser encountered an error:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, (error as any)?.message || "Failed to create user in database");
    }
};

const registerOrganisation = async (organisationName: string, ownerId: string) => {
    console.log("[AUTH:registerOrganisation] Step 1: registerOrganisation called with orgName:", organisationName, "for ownerId:", ownerId);
    try {
        console.log("[AUTH:registerOrganisation] Step 2: Validating organisation name...");
        if ([organisationName].some(field => field.trim() === "")) {
            console.error("[AUTH:registerOrganisation] Validation failed: organisation name is empty");
            throw new ApiError(400, "All Fields are Required");
        }

        console.log("[AUTH:registerOrganisation] Step 3: Checking if organisation name already exists in database:", organisationName);
        if (await prisma.organisation.findFirst({ where: { organisationName } })) {
            console.error("[AUTH:registerOrganisation] Organisation name already exists:", organisationName);
            throw new ApiError(400, "Organisation already exists");
        }

        console.log("[AUTH:registerOrganisation] Step 4: Finding owner user in database for ownerId:", ownerId);
        const owner = await prisma.user.findUnique({ where: { id: ownerId } });
        if (!owner) {
            console.error("[AUTH:registerOrganisation] Owner user not found for ownerId:", ownerId);
            throw new ApiError(404, "User not found");
        }

        console.log("[AUTH:registerOrganisation] Step 5: Checking if owner already belongs to an organisation...");
        if (owner?.organisationId) {
            console.error("[AUTH:registerOrganisation] User already belongs to an organisation:", owner.organisationId);
            throw new ApiError(400, "User already part of a Organisation");
        }

        console.log("[AUTH:registerOrganisation] Step 6: Creating organisation record in database...");
        const newOrg = await prisma.organisation.create({
            data: {
                organisationName,
                ownerId,
            }
        });

        console.log("[AUTH:registerOrganisation] Step 7: Fetching created organisation record for id:", newOrg.id);
        const createdOrg = await prisma.organisation.findUnique({
            where: { id: newOrg.id },
            select: {
                id: true,
                organisationName: true,
                ownerId: true,
            }
        });
        console.log("[AUTH:registerOrganisation] Step 8: Organisation created successfully.");
        return createdOrg;

    } catch (error) {
        console.error("[AUTH:registerOrganisation] registerOrganisation encountered an error:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, (error as any)?.message || "Failed to create organisation in database");
    }
};

// helper function

// route funciton

// main function 

const registerWithNewOrganisation = async (req: Request, res: Response) => {
    console.log("[AUTH:registerWithNewOrganisation] Step 1: Request received to register user with a new organisation.");
    try {
        const { email } = req.body;
        console.log("[AUTH:registerWithNewOrganisation] Step 2: Extracting email from request body:", email);
        const trimmedEmail = email ? email.trim() : "";

        console.log("[AUTH:registerWithNewOrganisation] Step 3: Checking staged registration data in middleware or Redis for:", trimmedEmail);
        // Check attached staged registration from registerVerification middleware or directly from Redis
        const staged = (req as any).stagedRegistration || (await (async () => {
            const str = await redisClient.get(`pending_registration:${trimmedEmail}`);
            return str ? JSON.parse(str) : null;
        })());

        let name = req.body.name;
        let passwordHash = "";
        let organisationName = req.body.organisationName;
        let isAlreadyHashed = false;

        console.log("[AUTH:registerWithNewOrganisation] Step 4: Resolving credentials (staged data available:", !!staged, ")...");
        if (staged) {
            name = staged.name;
            passwordHash = staged.passwordHash;
            organisationName = staged.organisationName || organisationName;
            isAlreadyHashed = true;
            console.log("[AUTH:registerWithNewOrganisation] Using staged data from Redis for user:", name, "org:", organisationName);
        } else if (req.body.password && req.body.organisationName) {
            passwordHash = req.body.password;
            isAlreadyHashed = false;
            console.log("[AUTH:registerWithNewOrganisation] Using raw credentials directly from request body.");
        } else {
            console.error("[AUTH:registerWithNewOrganisation] Registration session expired or credentials missing");
            throw new ApiError(400, "Registration session has expired or does not exist. Please register again.");
        }

        console.log("[AUTH:registerWithNewOrganisation] Step 5: Checking organisation name validity...");
        if (!organisationName) {
            console.error("[AUTH:registerWithNewOrganisation] Organisation name missing");
            throw new ApiError(400, "Organisation name is required");
        }

        console.log("[AUTH:registerWithNewOrganisation] Step 6: Calling registerUser to create Owner user...");
        const createdUser = await registerUser(name, trimmedEmail, "Owner", passwordHash, isAlreadyHashed);
        if (!createdUser) {
            console.error("[AUTH:registerWithNewOrganisation] Failed to create user record");
            throw new ApiError(500, "Failed to register user");
        }

        console.log("[AUTH:registerWithNewOrganisation] Step 7: Calling registerOrganisation to create organisation:", organisationName);
        const createdOrg = await registerOrganisation(organisationName, createdUser.id);
        if (!createdOrg) {
            console.error("[AUTH:registerWithNewOrganisation] Failed to create organisation record");
            throw new ApiError(500, "Failed to register organisation");
        }

        console.log("[AUTH:registerWithNewOrganisation] Step 8: Linking created user with organisationId:", createdOrg.id);
        const updatedUser = await prisma.user.update({
            where: { id: createdUser.id },
            data: { organisationId: createdOrg.id },
            select: { id: true, name: true, email: true, role: true, organisationId: true }
        });

        console.log("[AUTH:registerWithNewOrganisation] Step 9: Removing pending registration from Redis for:", trimmedEmail);
        await redisClient.del(`pending_registration:${trimmedEmail}`);

        console.log("[AUTH:registerWithNewOrganisation] Step 10: Generating login tokens (refresh and access)...");
        const { refreshToken, accessToken } = await newLoginTokens(updatedUser);

        console.log("[AUTH:registerWithNewOrganisation] Step 11: Registration complete. Returning 201 response with cookies.");
        return res.status(201).cookie("refreshToken", refreshToken, refreshCookieOptions).json(
            new ApiResponse(201, {
                accessToken, user: {
                    id: updatedUser?.id,
                    name: updatedUser?.name,
                    email: updatedUser?.email,
                    role: updatedUser?.role,
                    organisationId: updatedUser?.organisationId,
                }
            }, "New User registered and logged in successfully"));
    } catch (error) {
        console.error("[AUTH:registerWithNewOrganisation] registerWithNewOrganisation error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Something went wrong" });
    }
};

const newUserRegistration = async (req: Request, res: Response) => {
    console.log("[AUTH:newUserRegistration] Step 1: Request received for newUserRegistration.");
    try {
        const { email } = req.body;
        console.log("[AUTH:newUserRegistration] Step 2: Extracting email from request body:", email);
        const trimmedEmail = email ? email.trim() : "";

        console.log("[AUTH:newUserRegistration] Step 3: Checking staged registration data for:", trimmedEmail);
        // Check attached staged registration from registerVerification middleware or directly from Redis
        const staged = (req as any).stagedRegistration || (await (async () => {
            const str = await redisClient.get(`pending_registration:${trimmedEmail}`);
            return str ? JSON.parse(str) : null;
        })());

        let name = req.body.name;
        let passwordHash = "";
        let inviteToken = req.body.inviteToken;
        let isAlreadyHashed = false;

        console.log("[AUTH:newUserRegistration] Step 4: Resolving user credentials (staged available:", !!staged, ")...");
        if (staged) {
            name = staged.name;
            passwordHash = staged.passwordHash;
            inviteToken = staged.inviteToken || inviteToken;
            isAlreadyHashed = true;
            console.log("[AUTH:newUserRegistration] Using staged data from Redis for user:", name);
        } else if (req.body.password) {
            passwordHash = req.body.password;
            isAlreadyHashed = false;
            console.log("[AUTH:newUserRegistration] Using raw credentials directly from request body.");
        } else {
            console.error("[AUTH:newUserRegistration] Registration session expired or credentials missing");
            throw new ApiError(400, "Registration session has expired or does not exist. Please register again.");
        }

        console.log("[AUTH:newUserRegistration] Step 5: Calling registerUser to create Employee user...");
        const createdUser = await registerUser(name, trimmedEmail, "Employee", passwordHash, isAlreadyHashed);
        if (!createdUser) {
            console.error("[AUTH:newUserRegistration] Failed to create user record");
            throw new ApiError(500, "Failed to register user");
        }

        let finalUser = createdUser;
        console.log("[AUTH:newUserRegistration] Step 6: Checking if inviteToken was provided:", inviteToken);
        if (inviteToken) {
            console.log("[AUTH:newUserRegistration] Step 7: Verifying inviteToken in database...");
            const organisation = await prisma.organisation.findFirst({
                where: { inviteToken: inviteToken.trim() }
            });
            if (organisation && organisation.inviteTimestamps && organisation.inviteTimestamps >= new Date()) {
                console.log("[AUTH:newUserRegistration] Step 8: Valid inviteToken found. Associating user with organisation:", organisation.id);
                finalUser = await prisma.user.update({
                    where: { id: createdUser.id },
                    data: { organisationId: organisation.id },
                    select: { id: true, name: true, email: true, role: true, organisationId: true }
                });
            } else {
                console.warn("[AUTH:newUserRegistration] Invite token was invalid or expired. User registered without organisation association.");
            }
        }

        console.log("[AUTH:newUserRegistration] Step 9: Removing pending registration from Redis for:", trimmedEmail);
        await redisClient.del(`pending_registration:${trimmedEmail}`);

        console.log("[AUTH:newUserRegistration] Step 10: Generating login tokens (refresh and access)...");
        const { refreshToken, accessToken } = await newLoginTokens(finalUser);

        console.log("[AUTH:newUserRegistration] Step 11: Registration successful. Sending 201 response with cookies.");
        return res.status(201).cookie("refreshToken", refreshToken, refreshCookieOptions).json(
            new ApiResponse(201, {
                accessToken, user: {
                    id: finalUser?.id,
                    name: finalUser?.name,
                    email: finalUser?.email,
                    role: finalUser?.role,
                    organisationId: finalUser?.organisationId,
                }
            }, "New User registered and logged in successfully"));
    } catch (error) {
        console.error("[AUTH:newUserRegistration] newUserRegistration error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Something went wrong" });
    }
};

const joinOrganisation = async (req: Request, res: Response) => {
    console.log("[AUTH:joinOrganisation] Step 1: Request received to join organisation via inviteToken.");
    try {
        const { inviteToken } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const userOrgId = req.user.organisationId;
        console.log("[AUTH:joinOrganisation] Step 2: Request user details:", { userId, userRole, userOrgId });

        console.log("[AUTH:joinOrganisation] Step 3: Checking if user already belongs to an organisation...");
        if (userOrgId) {
            console.error("[AUTH:joinOrganisation] User already part of an organisation:", userOrgId);
            throw new ApiError(400, "Already part of an Organisation");
        }

        console.log("[AUTH:joinOrganisation] Step 4: Validating user role is not Owner...");
        if (userRole === "Owner") {
            console.error("[AUTH:joinOrganisation] Owner cannot join another organisation");
            throw new ApiError(400, "Owner cant join other organisation");
        }

        console.log("[AUTH:joinOrganisation] Step 5: Checking inviteToken presence in body...");
        if (!inviteToken) {
            console.error("[AUTH:joinOrganisation] Invite token missing");
            throw new ApiError(400, "Invite token is required");
        }

        console.log("[AUTH:joinOrganisation] Step 6: Querying database for organisation by inviteToken...");
        const organisation = await prisma.organisation.findFirst({
            where: { inviteToken },
        });

        if (!organisation) {
            console.error("[AUTH:joinOrganisation] Invalid invite token provided");
            throw new ApiError(404, "Invalid invite token");
        }

        console.log("[AUTH:joinOrganisation] Step 7: Checking invite token expiration timestamp...");
        if (
            !organisation.inviteTimestamps ||
            organisation.inviteTimestamps < new Date()
        ) {
            console.error("[AUTH:joinOrganisation] Invite token has expired");
            throw new ApiError(410, "Invite token has expired");
        }

        console.log("[AUTH:joinOrganisation] Step 8: Re-verifying user in database for userId:", userId);
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user?.organisationId) {
            console.error("[AUTH:joinOrganisation] User already belongs to an organisation:", user.organisationId);
            throw new ApiError(400, "You already belong to an organisation");
        }

        console.log("[AUTH:joinOrganisation] Step 9: Attaching user to organisation with Employee role in database...");
        // 4. attach the user — role is fixed, never taken from client input
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                organisationId: organisation.id,
                role: "Employee",
            },
            select: { id: true, name: true, email: true, role: true, organisationId: true },
        });

        console.log("[AUTH:joinOrganisation] Step 10: User successfully joined organisation:", organisation.id);
        return res.status(200).json(
            new ApiResponse(200, { updatedUser }, "Joined organisation successfully")
        );

    } catch (error) {
        console.error("[AUTH:joinOrganisation] joinOrganisation error:", error);
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
};

const userOwnerWithoutOrg = async (req: Request, res: Response) => {
    console.log("[AUTH:userOwnerWithoutOrg] Step 1: Request received for Owner without organisation to create one.");
    try {
        const orgOwnerId = req.user.userId;
        const { orgName } = req.body;
        console.log("[AUTH:userOwnerWithoutOrg] Step 2: Request details: orgOwnerId:", orgOwnerId, "orgName:", orgName);

        console.log("[AUTH:userOwnerWithoutOrg] Step 3: Checking if user already belongs to an organisation...");
        if (req.user.organisationId) {
            console.error("[AUTH:userOwnerWithoutOrg] User already belongs to an organisation:", req.user.organisationId);
            throw new ApiError(400, "User already belongs to an organisation");
        }

        console.log("[AUTH:userOwnerWithoutOrg] Step 4: Verifying user role is Owner...");
        if (req.user.role !== "Owner") {
            console.error("[AUTH:userOwnerWithoutOrg] User is not an Owner:", req.user.role);
            throw new ApiError(403, "Only users with the Owner role can create an organisation");
        }

        console.log("[AUTH:userOwnerWithoutOrg] Step 5: Validating orgName...");
        if (!orgName || orgName.trim() === "") {
            console.error("[AUTH:userOwnerWithoutOrg] Organisation name is required");
            throw new ApiError(400, "Organisation name is required");
        }

        console.log("[AUTH:userOwnerWithoutOrg] Step 6: Calling registerOrganisation...");
        const createdOrg = await registerOrganisation(orgName, orgOwnerId);
        if (!createdOrg) {
            console.error("[AUTH:userOwnerWithoutOrg] Failed to create organisation");
            throw new ApiError(500, "Failed to create organisation");
        }

        console.log("[AUTH:userOwnerWithoutOrg] Step 7: Updating user with organisationId:", createdOrg.id);
        const updatedUser = await prisma.user.update({
            where: { id: orgOwnerId },
            data: { organisationId: createdOrg.id },
            select: { id: true, name: true, email: true, role: true, organisationId: true }
        });

        console.log("[AUTH:userOwnerWithoutOrg] Step 8: Organisation created and linked successfully.");
        return res.status(201).json(
            new ApiResponse(201, { data: { updatedUser, createdOrg } }, "New Organisation registered successfully")
        );
    } catch (error) {
        console.error("[AUTH:userOwnerWithoutOrg] userOwnerWithoutOrg error:", error);
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
};

const registerVerification = async (req: Request, res: Response, next?: NextFunction) => {
    console.log("[AUTH:registerVerification] Step 1: Request received in registerVerification. Path:", req.path);
    try {
        const { name, email, password, registrationPath, organisationName, inviteToken } = req.body;
        console.log("[AUTH:registerVerification] Step 2: Extracting request body fields:", {
            email,
            name,
            registrationPath,
            organisationName,
            inviteToken: inviteToken ? "provided" : undefined,
            hasPassword: !!password
        });

        console.log("[AUTH:registerVerification] Step 3: Validating email parameter...");
        if (!email || typeof email !== "string" || !email.trim()) {
            console.error("[AUTH:registerVerification] Validation failed: email is missing or empty");
            throw new ApiError(400, "Email is required");
        }
        const trimmedEmail = email.trim();

        // -------------------------------------------------------------
        // Mode 1: Middleware on final registration route (/newUserRegistration, /registerWithNewOrganisation)
        // -------------------------------------------------------------
        const isRegistrationRoute = req.path.includes("registerWithNewOrganisation") || req.path.includes("newUserRegistration");
        console.log("[AUTH:registerVerification] Step 4: Checking registration mode. isRegistrationRoute:", isRegistrationRoute, "has next():", !!next);

        if (isRegistrationRoute && next) {
            console.log("[AUTH:registerVerification:Mode1] Checking Redis for staged registration key 'pending_registration:" + trimmedEmail + "'...");
            const stagedDataStr = await redisClient.get(`pending_registration:${trimmedEmail}`);
            if (stagedDataStr) {
                console.log("[AUTH:registerVerification:Mode1] Staged registration found in Redis. Attaching to request...");
                const staged = JSON.parse(stagedDataStr);
                (req as any).stagedRegistration = staged;

                console.log("[AUTH:registerVerification:Mode1] Checking if user already exists in DB for email:", trimmedEmail);
                const existingUser = await prisma.user.findFirst({ where: { email: trimmedEmail } });
                if (existingUser) {
                    console.error("[AUTH:registerVerification:Mode1] User already exists in DB:", trimmedEmail);
                    throw new ApiError(400, "User with this email already exists");
                }

                // If registering with new organisation, verify org name is still available
                const orgName = staged.organisationName || organisationName;
                if (req.path.includes("registerWithNewOrganisation") || staged.registrationPath === "newOrg") {
                    console.log("[AUTH:registerVerification:Mode1] Validating organisation name availability:", orgName);
                    if (!orgName || typeof orgName !== "string" || orgName.trim() === "") {
                        console.error("[AUTH:registerVerification:Mode1] Organisation name missing");
                        throw new ApiError(400, "Organisation name is required");
                    }
                    const existingOrg = await prisma.organisation.findFirst({
                        where: { organisationName: orgName.trim() }
                    });
                    if (existingOrg) {
                        console.error("[AUTH:registerVerification:Mode1] Organisation name already taken:", orgName);
                        throw new ApiError(400, "Organisation already exists");
                    }
                }

                console.log("[AUTH:registerVerification:Mode1] Staged verification passed. Calling next().");
                return next();
            }

            // Fallback if client passed full registration details directly in req.body
            console.log("[AUTH:registerVerification:Mode1] No staged registration found in Redis. Checking direct body credentials...");
            if (name && password) {
                console.log("[AUTH:registerVerification:Mode1] Checking if user already exists in DB...");
                const existingUser = await prisma.user.findFirst({ where: { email: trimmedEmail } });
                if (existingUser) {
                    console.error("[AUTH:registerVerification:Mode1] Direct body validation: user already exists");
                    throw new ApiError(400, "User with this email already exists");
                }
                if (req.path.includes("registerWithNewOrganisation") || organisationName) {
                    console.log("[AUTH:registerVerification:Mode1] Checking organisation name availability...");
                    if (!organisationName || typeof organisationName !== "string" || organisationName.trim() === "") {
                        console.error("[AUTH:registerVerification:Mode1] Direct body validation: organisation name missing");
                        throw new ApiError(400, "Organisation name is required");
                    }
                    const existingOrg = await prisma.organisation.findFirst({
                        where: { organisationName: organisationName.trim() }
                    });
                    if (existingOrg) {
                        console.error("[AUTH:registerVerification:Mode1] Direct body validation: organisation already exists");
                        throw new ApiError(400, "Organisation already exists");
                    }
                }
                console.log("[AUTH:registerVerification:Mode1] Direct body validation passed. Calling next().");
                return next();
            }

            console.error("[AUTH:registerVerification:Mode1] Registration session expired or not found");
            throw new ApiError(400, "Registration session has expired or does not exist. Please register again.");
        }

        // -------------------------------------------------------------
        // Mode 2: Initial verification & OTP generation endpoint (/registerVerification, /registrationMail)
        // -------------------------------------------------------------
        console.log("[AUTH:registerVerification:Mode2] Handling initial registration verification & OTP generation.");

        // If resending OTP for an active pending session:
        if (!name && !password) {
            console.log("[AUTH:registerVerification:Mode2] Resend OTP request detected. Checking Redis pending session for:", trimmedEmail);
            const staged = await redisClient.get(`pending_registration:${trimmedEmail}`);
            if (!staged) {
                console.error("[AUTH:registerVerification:Mode2] Resend failed: pending registration session expired in Redis");
                throw new ApiError(400, "Registration session expired. Please register again.");
            }
            console.log("[AUTH:registerVerification:Mode2] Active session found. Generating new OTP...");
            const otp = otpGenerator();
            await redisClient.set(`otp:${trimmedEmail}`, otp, { 'EX': 600 });
            console.log("[AUTH:registerVerification:Mode2] Dispatching resent OTP email via sendMail...");
            await sendMail(trimmedEmail, "otp", `Your OTP for registration is ${otp}. This code is valid for 10 minutes.`);
            console.log("[AUTH:registerVerification:Mode2] Resent OTP dispatched. Returning 200 response.");
            return res.status(200).json(
                new ApiResponse(200, null, "OTP resent successfully to your email.")
            );
        }

        console.log("[AUTH:registerVerification:Mode2] Validating name, email, and password...");
        if (!name || !password || [name, password].some(field => typeof field !== "string" || field.trim() === "")) {
            console.error("[AUTH:registerVerification:Mode2] Validation failed: missing name, email, or password");
            throw new ApiError(400, "All fields (name, email, password) are required");
        }

        const trimmedName = name.trim();

        // 1. Check if user already exists
        console.log("[AUTH:registerVerification:Mode2] Step 5a: Checking if user already exists in database for email:", trimmedEmail);
        const existingUser = await prisma.user.findFirst({ where: { email: trimmedEmail } });
        if (existingUser) {
            console.error("[AUTH:registerVerification:Mode2] User with email already exists in DB:", trimmedEmail);
            throw new ApiError(400, "User with this email already exists");
        }

        // 2. Validate organisation name if registering a new organisation
        if (registrationPath === "newOrg" || organisationName) {
            console.log("[AUTH:registerVerification:Mode2] Step 5b: Validating new organisation name:", organisationName);
            if (!organisationName || typeof organisationName !== "string" || organisationName.trim() === "") {
                console.error("[AUTH:registerVerification:Mode2] Organisation name missing");
                throw new ApiError(400, "Organisation name is required");
            }
            const existingOrg = await prisma.organisation.findFirst({
                where: { organisationName: organisationName.trim() }
            });
            if (existingOrg) {
                console.error("[AUTH:registerVerification:Mode2] Organisation name already exists:", organisationName);
                throw new ApiError(400, "Organisation already exists");
            }
        }

        // 3. Validate invite token if joining an existing organisation
        if (registrationPath === "existingOrg" || inviteToken) {
            console.log("[AUTH:registerVerification:Mode2] Step 5c: Validating invite token:", inviteToken);
            if (inviteToken) {
                const org = await prisma.organisation.findFirst({
                    where: { inviteToken: inviteToken.trim() }
                });
                if (!org) {
                    console.error("[AUTH:registerVerification:Mode2] Invalid invite token:", inviteToken);
                    throw new ApiError(404, "Invalid invite token");
                }
                if (!org.inviteTimestamps || org.inviteTimestamps < new Date()) {
                    console.error("[AUTH:registerVerification:Mode2] Invite token expired at:", org.inviteTimestamps);
                    throw new ApiError(410, "Invite token has expired");
                }
            }
        }

        // 4. Hash password before caching in Redis
        console.log("[AUTH:registerVerification:Mode2] Step 5d: Hashing user password before staging in Redis...");
        const passwordHash = await hashingPassword(password);

        // 5. Stage pending registration details in Redis (TTL: 600s / 10 minutes)
        console.log("[AUTH:registerVerification:Mode2] Step 5e: Staging registration details in Redis under key 'pending_registration:" + trimmedEmail + "' with 600s TTL...");
        const pendingData = {
            name: trimmedName,
            email: trimmedEmail,
            passwordHash,
            registrationPath: registrationPath || (organisationName ? "newOrg" : "existingOrg"),
            organisationName: organisationName ? organisationName.trim() : undefined,
            inviteToken: inviteToken ? inviteToken.trim() : undefined
        };
        await redisClient.set(`pending_registration:${trimmedEmail}`, JSON.stringify(pendingData), { 'EX': 600 });

        // 6. Generate OTP and store in Redis (TTL: 600s / 10 minutes)
        console.log("[AUTH:registerVerification:Mode2] Step 5f: Generating 6-digit OTP and storing in Redis under key 'otp:" + trimmedEmail + "' with 600s TTL...");
        const otp = otpGenerator();
        await redisClient.set(`otp:${trimmedEmail}`, otp, { 'EX': 600 });

        // 7. Send OTP Email
        console.log("[AUTH:registerVerification:Mode2] Step 5g: Sending OTP verification email via sendMail...");
        await sendMail(trimmedEmail, "otp", `Your OTP for registration is ${otp}. This code is valid for 10 minutes.`);

        console.log("[AUTH:registerVerification:Mode2] Step 5h: Initial verification successful. Returning 200 response.");
        return res.status(200).json(
            new ApiResponse(200, null, "Verification successful. OTP sent to your email.")
        );
    } catch (error) {
        console.error("[AUTH:registerVerification] registerVerification error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Failed to process registration verification" });
    }
};

const generateMailOTP = registerVerification;

const otpVerification = async (req: Request, res: Response, next: NextFunction) => {
    console.log("[AUTH:otpVerification] Step 1: Request received in otpVerification middleware.");
    try {
        const { email, inputOtp } = req.body;
        console.log("[AUTH:otpVerification] Step 2: Body received. Checking email and inputOtp presence...");
        if (!email || !inputOtp) {
            console.error("[AUTH:otpVerification] Validation failed: email or inputOtp missing");
            throw new ApiError(400, "Email and OTP are required");
        }

        const trimmedEmail = email.trim();
        console.log("[AUTH:otpVerification] Step 3: Checking Redis for OTP key 'otp:" + trimmedEmail + "'...");
        const storedOtp = await redisClient.get(`otp:${trimmedEmail}`);
        if (!storedOtp) {
            console.error("[AUTH:otpVerification] OTP expired or not requested in Redis for:", trimmedEmail);
            throw new ApiError(400, "OTP has expired or was not requested");
        }

        console.log("[AUTH:otpVerification] Step 4: Comparing stored Redis OTP against inputOtp...");
        if (storedOtp !== inputOtp.toString()) {
            console.error("[AUTH:otpVerification] Invalid OTP provided for email:", trimmedEmail);
            throw new ApiError(400, "otp is wrong");
        }

        console.log("[AUTH:otpVerification] Step 5: OTP matched. Removing used OTP from Redis for:", trimmedEmail);
        await redisClient.del(`otp:${trimmedEmail}`);

        console.log("[AUTH:otpVerification] Step 6: OTP verification successful. Proceeding to next().");
        return next();
    } catch (error) {
        console.error("[AUTH:otpVerification] otpVerification error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong in otpVerification" });
    }
};

// other route

// route funciton

export {
    registerWithNewOrganisation,
    newUserRegistration,
    joinOrganisation,
    userOwnerWithoutOrg,
    generateMailOTP,
    registerVerification,
    otpVerification
}; 