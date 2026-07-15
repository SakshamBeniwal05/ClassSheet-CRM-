import { PrismaClient, Role } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import ApiError from "../utils/api.error.js";
import ApiResponse from "../utils/api.response.js";


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// Pass the adapter instance to PrismaClient
export const prisma = new PrismaClient({ adapter });


const hashingPassword = async (passowrd: string) => {
    const hashedPassword = await bcrypt.hash(passowrd, 10)
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
                organisation_id: true,
            }
        })
        return createdUser;
    } catch (error) {

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
        const newOrg = await prisma.organisation.create({
            data: {
                organisationName,
                ownerId,
            }
        })
        const createdOrg = await prisma.organisation.findUnique({
            where: { ownerId },
            select: {
                id: true,
                organisationName: true,
                ownerId: true,
            }
        })
        return createdOrg;

    } catch (error) {

    }
}


const registerWithNewOrganisation = async (req: Request, res: Response) => {

    try {
        const { name, email, password, role, organisationName } = req.body;
        const createdUser = await registerUser(name, email, "Owner", password)
        const createdOrg = await registerOrganisation(organisationName, createdUser?.id ?? "")
        await prisma.user.update({
            where: { id: createdUser.id },
            data: { organisationId: createdOrg.id },
        });
        return res.status(201).json(
            new ApiResponse(201, { data: { createdUser, createdOrg } }, "User and New Organisation registered successfully")
        )
    } catch (error) {

    }
}

const newUserRegistration = async (req: Request, res: Response) => {

    try {
        const { name, email, role, password, } = req.body;
        const createdUser = await registerUser(name, email, "Employee", password)
        return res.status(201).json(
            new ApiResponse(201, { data: { createdUser } }, "User and New Organisation registered successfully")
        )
    } catch (error) {

    }
}
const joinOrganisation = async (req: Request, res: Response) => {

    try {
        const { inviteToken } = req.body;
        const userId = req.user.id;

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
export default { registerWithNewOrganisation, registerOrganisation, newUserRegistration, joinOrganisation }