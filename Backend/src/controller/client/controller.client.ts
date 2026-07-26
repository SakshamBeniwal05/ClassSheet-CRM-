import type { Request, Response } from "express";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";
import { prisma } from "../../main.js";

const createClient = async (req: Request, res: Response) => {
    try {
        const { name, email, role } = req.body;
        const authorId = req.user?.userId;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation to add clients");
        }

        if (!name || !email) {
            throw new ApiError(400, "Name and Email are required");
        }

        const client = await prisma.client.create({
            data: {
                name,
                email,
                role: role || null,
                authorId: authorId || null,
                dealHandlingOrganisationId: organisationId,
            },
        });

        return res.status(201).json(new ApiResponse(201, { client }, "Client created successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create client" });
    }
};

const getClients = async (req: Request, res: Response) => {
    try {
        const organisationId = req.user?.organisationId;
        const role = req.user?.role
        const userID = req.user?.userId

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation to view clients");
        }

        const isOwnerOrAdmin = role === "Owner" || role === "Admin"
        const clients = await prisma.client.findMany({
            where: { dealHandlingOrganisationId: organisationId, ...(isOwnerOrAdmin ? {} : { authorId: userID }) },
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { deals: true, reminders: true },
                },
            },
            orderBy: { id: "desc" },
        });

        return res.status(200).json(new ApiResponse(200, { clients }, "Clients fetched successfully"));

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch clients" });
    }
};

const getParticularClient = async (req: Request, res: Response) => {
    try {
        const ALLOWED_CLIENT_SEARCH_FIELDS = ["id", "email"] as const;
        type ClientSearchField = typeof ALLOWED_CLIENT_SEARCH_FIELDS[number];
        const { criteria, value } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }
        if (!ALLOWED_CLIENT_SEARCH_FIELDS.includes(criteria as ClientSearchField)) {
            throw new ApiError(400, "Invalid search criteria");
        }

        const client = await prisma.client.findFirst({
            where: {
                [criteria]: value,
                dealHandlingOrganisationId: organisationId,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
                deals: true,
                reminders: true,
            },
        });

        if (!client) {
            throw new ApiError(404, "Client not found");
        }

        return res.status(200).json(new ApiResponse(200, { client }, "Client details fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch client details" });
    }
};

const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;
        const organisationId = req.user?.organisationId;
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const isOwnerOrAdmin = (userRole === "Owner" || userRole === "Admin");

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }
        const existingClient = await prisma.client.findFirst({

            where: { id, dealHandlingOrganisationId: organisationId },
        });

        if (!existingClient) {
            throw new ApiError(404, "Client not found or unauthorized");
        }

        if (!isOwnerOrAdmin && existingClient.authorId !== userId) {
            throw new ApiError(403, "You can only update clients you authored");
        }

        const updatedClient = await prisma.client.update({
            where: { id, },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(role !== undefined && { role }),
            },
        });

        return res.status(200).json(new ApiResponse(200, { client: updatedClient }, "Client updated successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update client" });
    }
};

const deleteClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;
        const userRole = req.user?.role;
        const userId = req.user?.userId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const isOwnerOrAdmin = (userRole === "Owner" || userRole === "Admin");

        const existingClient = await prisma.client.findFirst({
            where: { id, dealHandlingOrganisationId: organisationId, ...(isOwnerOrAdmin ? {} : { authorId: userId }) },
        });

        if (!existingClient) {
            throw new ApiError(404, "Client not found or unauthorized");
        }

        if (!isOwnerOrAdmin && existingClient.authorId !== userId) {
            throw new ApiError(403, "You can only delete deals you authored");
        }

        await prisma.client.delete({
            where: { id},
        });

        return res.status(200).json(new ApiResponse(200, {}, "Client deleted successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to delete client" });
    }
};

export { createClient, getClients, getParticularClient, updateClient, deleteClient };
