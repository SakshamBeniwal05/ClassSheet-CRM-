import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { newLoginTokens, refreshCookieOptions } from "./controller.active.js";
import type { Role } from "../../generated/prisma/enums.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";
import { prisma } from "../../main.js";


// helper function

const hashingPassword = async (password: string) => {
    const hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword
}

const registerUser = async (name: string, email: string, role: Role, password: string,) => {
    try {
        if ([name, email, password].some(field => field.trim() === "")) {
            throw new ApiError(400, "All Fields are Required")
        }
        if (await prisma.user.findFirst({ where: { email } })) {
            throw new ApiError(400, "Email already exists")
        }
        const hashedPassword = await hashingPassword(password)
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
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, "Cant create registerUser")
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
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, "Cant create registerOrganisation")
    }
}

// helper function


// route funciton

// main function 

const registerWithNewOrganisation = async (req: Request, res: Response) => {

    try {
        const { name, email, password, organisationName } = req.body;
        const createdUser = await registerUser(name, email, "Owner", password)
        const createdOrg = await registerOrganisation(organisationName, createdUser?.id ?? "")
        const updatedUser = await prisma.user.update({
            where: { id: createdUser?.id || "" },
            data: { organisationId: createdOrg?.id || "" },
            select: { id: true, name: true, email: true, role: true, organisationId: true }
        });
        const { refreshToken, accessToken } = await newLoginTokens(updatedUser)

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
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
}

const newUserRegistration = async (req: Request, res: Response) => {
    try {
        const { name, email, password, } = req.body;
        const createdUser = await registerUser(name, email, "Employee", password)

        const { refreshToken, accessToken } = await newLoginTokens(createdUser)

        return res.status(201).cookie("refreshToken", refreshToken, refreshCookieOptions).json(
            new ApiResponse(201, {
                accessToken, user: {
                    id: createdUser?.id,
                    name: createdUser?.name,
                    email: createdUser?.email,
                    role: createdUser?.role,
                    organisationId: createdUser?.organisationId,
                }
            }, "New User registered and logged in successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
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

// other route

// route funciton

export { registerWithNewOrganisation, newUserRegistration, joinOrganisation, userOwnerWithoutOrg } 