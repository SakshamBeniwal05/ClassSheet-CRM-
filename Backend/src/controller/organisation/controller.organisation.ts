import type { Request, Response } from "express";
import { prisma } from "../../main.js";
import crypto from "crypto";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";

const getOrganisationDetails = async (req: Request, res: Response) => {
    try {
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User does not belong to any organisation");
        }

        const organisation = await prisma.organisation.findUnique({
            where: { id: organisationId },
            include: {
                owner: { select: { id: true, name: true, email: true, role: true } },
                _count: {
                    select: { members: true, clients: true, deals: true },
                },
            },
        });

        if (!organisation) {
            throw new ApiError(404, "Organisation not found");
        }

        return res.status(200).json(new ApiResponse(200, { organisation }, "Organisation details fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch organisation details" });
    }
};

const generateInviteToken = async (req: Request, res: Response) => {
    try {
        const organisationId = req.user?.organisationId;
        const role = req.user?.role;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        if (role !== "Owner" && role !== "Admin") {
            throw new ApiError(403, "Only Owner or Admin can generate invite tokens");
        }

        const inviteToken = crypto.randomBytes(16).toString("hex");
        const inviteTimestamps = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expires in 7 days

        const updatedOrg = await prisma.organisation.update({
            where: { id: organisationId },
            data: { inviteToken, inviteTimestamps },
            select: { id: true, organisationName: true, inviteToken: true, inviteTimestamps: true },
        });

        return res.status(200).json(
            new ApiResponse(200, { invite: updatedOrg }, "Invite token generated successfully")
        );
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to generate invite token" });
    }
};

const getOrganisationMembers = async (req: Request, res: Response) => {
    try {
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const members = await prisma.user.findMany({
            where: { organisationId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { name: "asc" },
        });

        return res.status(200).json(new ApiResponse(200, { members }, "Members fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch members" });
    }
};

const removeMember = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;
        const organisationId = req.user?.organisationId;
        const userRole = req.user?.role;
        const currentUserId = req.user?.userId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        if (userRole !== "Owner" && userRole !== "Admin") {
            throw new ApiError(403, "Only Owner or Admin can remove members");
        }

        const member = await prisma.user.findFirst({
            where: { id: memberId, organisationId },
        });

        if (!member) {
            throw new ApiError(404, "Member not found in your organisation");
        }

        if (member.id === currentUserId) {
            throw new ApiError(400, "You cannot remove yourself");
        }

        if (member.role === "Owner") {
            throw new ApiError(403, "Cannot remove the Owner of the organisation");
        }

        const updatedUser = await prisma.user.update({
            where: { id: memberId },
            data: { organisationId: null },
            select: { id: true, name: true, email: true },
        });

        return res.status(200).json(new ApiResponse(200, { member: updatedUser }, "Member removed from organisation"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to remove member" });
    }
};

export { getOrganisationDetails, generateInviteToken, getOrganisationMembers, removeMember };
