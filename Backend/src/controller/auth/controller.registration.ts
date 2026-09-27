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
    const hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword
}

const registerUser = async (name: string, email: string, role: Role, passwordOrHash: string, isAlreadyHashed: boolean = false) => {
    try {
        if ([name, email, passwordOrHash].some(field => !field || field.trim() === "")) {
            throw new ApiError(400, "All Fields are Required")
        }
        if (await prisma.user.findFirst({ where: { email } })) {
            throw new ApiError(400, "Email already exists")
        }
        const hashedPassword = isAlreadyHashed ? passwordOrHash : await hashingPassword(passwordOrHash)

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                role,
                passwordHash: hashedPassword,
            }
        })
        const createdUser = await prisma.user.findUnique({
            where: { id: newUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                organisationId: true,
            }
        })
        return createdUser;
    } catch (error) {
        console.error("registerUser error:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, (error as any)?.message || "Failed to create user in database");
    }
}

const registerOrganisation = async (organisationName: string, ownerId: string) => {
    try {
        if ([organisationName].some(field => field.trim() === "")) {
            throw new ApiError(400, "All Fields are Required")
        }
        if (await prisma.organisation.findFirst({ where: { organisationName } })) {
            throw new ApiError(400, "Organisation already exists")
        }
        const owner = await prisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) {
            throw new ApiError(404, "User not found");
        }
        if (owner?.organisationId) {
            throw new ApiError(400, "User already part of a Organisation")
        }

        const newOrg = await prisma.organisation.create({
            data: {
                organisationName,
                ownerId,
            }
        })
        const createdOrg = await prisma.organisation.findUnique({
            where: { id: newOrg.id },
            select: {
                id: true,
                organisationName: true,
                ownerId: true,
            }
        })
        return createdOrg;

    } catch (error) {
        console.error("registerOrganisation error:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, (error as any)?.message || "Failed to create organisation in database");
    }
}

// helper function

// route funciton

// main function 

const registerWithNewOrganisation = async (req: Request, res: Response) => {

    try {
        const { email } = req.body;
        const trimmedEmail = email ? email.trim() : "";

        // Check attached staged registration from registerVerification middleware or directly from Redis
        const staged = (req as any).stagedRegistration || (await (async () => {
            const str = await redisClient.get(`pending_registration:${trimmedEmail}`);
            return str ? JSON.parse(str) : null;
        })());

        let name = req.body.name;
        let passwordHash = "";
        let organisationName = req.body.organisationName;
        let isAlreadyHashed = false;

        if (staged) {
            name = staged.name;
            passwordHash = staged.passwordHash;
            organisationName = staged.organisationName || organisationName;
            isAlreadyHashed = true;
        } else if (req.body.password && req.body.organisationName) {
            passwordHash = req.body.password;
            isAlreadyHashed = false;
        } else {
            throw new ApiError(400, "Registration session has expired or does not exist. Please register again.");
        }

        if (!organisationName) {
            throw new ApiError(400, "Organisation name is required");
        }

        const createdUser = await registerUser(name, trimmedEmail, "Owner", passwordHash, isAlreadyHashed);
        if (!createdUser) {
            throw new ApiError(500, "Failed to register user");
        }
        const createdOrg = await registerOrganisation(organisationName, createdUser.id);
        if (!createdOrg) {
            throw new ApiError(500, "Failed to register organisation");
        }
        const updatedUser = await prisma.user.update({
            where: { id: createdUser.id },
            data: { organisationId: createdOrg.id },
            select: { id: true, name: true, email: true, role: true, organisationId: true }
        });

        await redisClient.del(`pending_registration:${trimmedEmail}`);

        const { refreshToken, accessToken } = await newLoginTokens(updatedUser);

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
        console.error("registerWithNewOrganisation error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Something went wrong" });
    }
}

const newUserRegistration = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const trimmedEmail = email ? email.trim() : "";

        // Check attached staged registration from registerVerification middleware or directly from Redis
        const staged = (req as any).stagedRegistration || (await (async () => {
            const str = await redisClient.get(`pending_registration:${trimmedEmail}`);
            return str ? JSON.parse(str) : null;
        })());

        let name = req.body.name;
        let passwordHash = "";
        let inviteToken = req.body.inviteToken;
        let isAlreadyHashed = false;

        if (staged) {
            name = staged.name;
            passwordHash = staged.passwordHash;
            inviteToken = staged.inviteToken || inviteToken;
            isAlreadyHashed = true;
        } else if (req.body.password) {
            passwordHash = req.body.password;
            isAlreadyHashed = false;
        } else {
            throw new ApiError(400, "Registration session has expired or does not exist. Please register again.");
        }

        const createdUser = await registerUser(name, trimmedEmail, "Employee", passwordHash, isAlreadyHashed);
        if (!createdUser) {
            throw new ApiError(500, "Failed to register user");
        }

        let finalUser = createdUser;
        if (inviteToken) {
            const organisation = await prisma.organisation.findFirst({
                where: { inviteToken: inviteToken.trim() }
            });
            if (organisation && organisation.inviteTimestamps && organisation.inviteTimestamps >= new Date()) {
                finalUser = await prisma.user.update({
                    where: { id: createdUser.id },
                    data: { organisationId: organisation.id },
                    select: { id: true, name: true, email: true, role: true, organisationId: true }
                });
            }
        }

        await redisClient.del(`pending_registration:${trimmedEmail}`);

        const { refreshToken, accessToken } = await newLoginTokens(finalUser);

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
        console.error("newUserRegistration error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Something went wrong" });
    }
}

const joinOrganisation = async (req: Request, res: Response) => {

    try {
        const { inviteToken } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const userOrgId = req.user.organisationId

        if (userOrgId) {
            throw new ApiError(400, "Already part of an Organisation");
        }

        if (userRole === "Owner") {
            throw new ApiError(400, "Owner cant join other organisation");
        }

        if (!inviteToken) {
            throw new ApiError(400, "Invite token is required");
        }

        const organisation = await prisma.organisation.findFirst({
            where: { inviteToken },
        });

        if (!organisation) {
            throw new ApiError(404, "Invalid invite token");
        }

        if (
            !organisation.inviteTimestamps ||
            organisation.inviteTimestamps < new Date()
        ) {
            throw new ApiError(410, "Invite token has expired");
        }


        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user?.organisationId) {
            throw new ApiError(400, "You already belong to an organisation");
        }

        // 4. attach the user — role is fixed, never taken from client input
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                organisationId: organisation.id,
                role: "Employee",
            },
            select: { id: true, name: true, email: true, role: true, organisationId: true },
        });

        return res.status(200).json(
            new ApiResponse(200, { updatedUser }, "Joined organisation successfully")
        );

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
}

// main function

// other route

const userOwnerWithoutOrg = async (req: Request, res: Response) => {
    try {
        const orgOwnerId = req.user.userId;
        const { orgName } = req.body;

        if (req.user.organisationId) {
            throw new ApiError(400, "User already belongs to an organisation");
        }

        if (req.user.role !== "Owner") {
            throw new ApiError(403, "Only users with the Owner role can create an organisation");
        }

        if (!orgName || orgName.trim() === "") {
            throw new ApiError(400, "Organisation name is required");
        }

        const createdOrg = await registerOrganisation(orgName, orgOwnerId)
        if (!createdOrg) {
            throw new ApiError(500, "Failed to create organisation");
        }

        const updatedUser = await prisma.user.update({
            where: { id: orgOwnerId },
            data: { organisationId: createdOrg.id },
            select: { id: true, name: true, email: true, role: true, organisationId: true }
        });

        return res.status(201).json(
            new ApiResponse(201, { data: { updatedUser, createdOrg } }, "New Organisation registered successfully")
        )
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
}

const registerVerification = async (req: Request, res: Response, next?: NextFunction) => {
    try {
        const { name, email, password, registrationPath, organisationName, inviteToken } = req.body;

        if (!email || typeof email !== "string" || !email.trim()) {
            throw new ApiError(400, "Email is required");
        }
        const trimmedEmail = email.trim();

        // -------------------------------------------------------------
        // Mode 1: Middleware on final registration route (/newUserRegistration, /registerWithNewOrganisation)
        // -------------------------------------------------------------
        const isRegistrationRoute = req.path.includes("registerWithNewOrganisation") || req.path.includes("newUserRegistration");

        if (isRegistrationRoute && next) {
            const stagedDataStr = await redisClient.get(`pending_registration:${trimmedEmail}`);
            if (stagedDataStr) {
                const staged = JSON.parse(stagedDataStr);
                (req as any).stagedRegistration = staged;

                // Ensure user hasn't been created in the meantime
                const existingUser = await prisma.user.findFirst({ where: { email: trimmedEmail } });
                if (existingUser) {
                    throw new ApiError(400, "User with this email already exists");
                }

                // If registering with new organisation, verify org name is still available
                const orgName = staged.organisationName || organisationName;
                if (req.path.includes("registerWithNewOrganisation") || staged.registrationPath === "newOrg") {
                    if (!orgName || typeof orgName !== "string" || orgName.trim() === "") {
                        throw new ApiError(400, "Organisation name is required");
                    }
                    const existingOrg = await prisma.organisation.findFirst({
                        where: { organisationName: orgName.trim() }
                    });
                    if (existingOrg) {
                        throw new ApiError(400, "Organisation already exists");
                    }
                }

                return next();
            }

            // Fallback if client passed full registration details directly in req.body
            if (name && password) {
                const existingUser = await prisma.user.findFirst({ where: { email: trimmedEmail } });
                if (existingUser) {
                    throw new ApiError(400, "User with this email already exists");
                }
                if (req.path.includes("registerWithNewOrganisation") || organisationName) {
                    if (!organisationName || typeof organisationName !== "string" || organisationName.trim() === "") {
                        throw new ApiError(400, "Organisation name is required");
                    }
                    const existingOrg = await prisma.organisation.findFirst({
                        where: { organisationName: organisationName.trim() }
                    });
                    if (existingOrg) {
                        throw new ApiError(400, "Organisation already exists");
                    }
                }
                return next();
            }

            throw new ApiError(400, "Registration session has expired or does not exist. Please register again.");
        }

        // -------------------------------------------------------------
        // Mode 2: Initial verification & OTP generation endpoint (/registerVerification, /registrationMail)
        // -------------------------------------------------------------

        // If resending OTP for an active pending session:
        if (!name && !password) {
            const staged = await redisClient.get(`pending_registration:${trimmedEmail}`);
            if (!staged) {
                throw new ApiError(400, "Registration session expired. Please register again.");
            }
            const otp = otpGenerator();
            await redisClient.set(`otp:${trimmedEmail}`, otp, { 'EX': 600 });
            await sendMail(trimmedEmail, "otp", `Your OTP for registration is ${otp}. This code is valid for 10 minutes.`);
            return res.status(200).json(
                new ApiResponse(200, null, "OTP resent successfully to your email.")
            );
        }

        if (!name || !password || [name, password].some(field => typeof field !== "string" || field.trim() === "")) {
            throw new ApiError(400, "All fields (name, email, password) are required");
        }

        const trimmedName = name.trim();

        // 1. Check if user already exists
        const existingUser = await prisma.user.findFirst({ where: { email: trimmedEmail } });
        if (existingUser) {
            throw new ApiError(400, "User with this email already exists");
        }

        // 2. Validate organisation name if registering a new organisation
        if (registrationPath === "newOrg" || organisationName) {
            if (!organisationName || typeof organisationName !== "string" || organisationName.trim() === "") {
                throw new ApiError(400, "Organisation name is required");
            }
            const existingOrg = await prisma.organisation.findFirst({
                where: { organisationName: organisationName.trim() }
            });
            if (existingOrg) {
                throw new ApiError(400, "Organisation already exists");
            }
        }

        // 3. Validate invite token if joining an existing organisation
        if (registrationPath === "existingOrg" || inviteToken) {
            if (inviteToken) {
                const org = await prisma.organisation.findFirst({
                    where: { inviteToken: inviteToken.trim() }
                });
                if (!org) {
                    throw new ApiError(404, "Invalid invite token");
                }
                if (!org.inviteTimestamps || org.inviteTimestamps < new Date()) {
                    throw new ApiError(410, "Invite token has expired");
                }
            }
        }

        // 4. Hash password before caching in Redis
        const passwordHash = await hashingPassword(password);

        // 5. Stage pending registration details in Redis (TTL: 600s / 10 minutes)
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
        const otp = otpGenerator();
        await redisClient.set(`otp:${trimmedEmail}`, otp, { 'EX': 600 });

        // 7. Send OTP Email
        await sendMail(trimmedEmail, "otp", `Your OTP for registration is ${otp}. This code is valid for 10 minutes.`);

        return res.status(200).json(
            new ApiResponse(200, null, "Verification successful. OTP sent to your email.")
        );
    } catch (error) {
        console.error("registerVerification error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Failed to process registration verification" });
    }
};

const generateMailOTP = registerVerification;

const otpVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, inputOtp } = req.body;
        if (!email || !inputOtp) {
            throw new ApiError(400, "Email and OTP are required");
        }

        const trimmedEmail = email.trim();
        const storedOtp = await redisClient.get(`otp:${trimmedEmail}`);
        if (!storedOtp) {
            throw new ApiError(400, "OTP has expired or was not requested");
        }

        if (storedOtp !== inputOtp.toString()) {
            throw new ApiError(400, "otp is wrong");
        }

        await redisClient.del(`otp:${trimmedEmail}`);

        return next();
    } catch (error) {
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