import type { Request, Response } from "express";
import type { State } from "../../generated/prisma/enums.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";
import { prisma } from "../../main.js";

const createDeal = async (req: Request, res: Response) => {
    try {
        const { clientId, amount, estimatedCost, stateOfDeal, currency, scheduled } = req.body;
        const authorId = req.user?.userId;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation to create deals");
        }

        if (!amount || !stateOfDeal) {
            throw new ApiError(400, "Amount and State of deal are required");
        }

        const client = await prisma.client.findFirst({
            where: { id: clientId },
            select: { id: true },
        });

        if (!client) {
            throw new ApiError(400, "Client does not exist with this email");
        }

        const deal = await prisma.deal.create({
            data: {
                clientId: client.id,
                authorId: authorId || null,
                dealOrganisation: organisationId,
                amount,
                estimatedCost: estimatedCost || null,
                stateOfDeal: stateOfDeal as State,
                currency: currency || "INR",
                scheduled: scheduled ? new Date(scheduled) : null,
            },
            include: {
                client: true,
                author: { select: { id: true, name: true, email: true } },
            },
        });

        return res.status(201).json(new ApiResponse(201, { deal }, "Deal created successfully"));

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create deal" });
    }
};

const getDeals = async (req: Request, res: Response) => {
    try {
        const role = req.user?.role;
        const userId = req.user?.userId;
        const organisationId = req.user?.organisationId;
        const { state } = req.query;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation to view deals");
        }

        const isOwnerOrAdmin = role === "Owner" || role === "Admin";

        const deals = await prisma.deal.findMany({
            where: {
                dealOrganisation: organisationId,
                ...(isOwnerOrAdmin ? {} : { authorId: userId }), // employees only see their own deals
                ...(state ? { stateOfDeal: state as State } : {}),
            },
            include: {
                client: { select: { id: true, name: true, email: true } },
                author: { select: { id: true, name: true, email: true } },
                _count: { select: { notes: true, media: true, reminders: true } },
            },
            orderBy: { id: "desc" },
        });

        return res.status(200).json(new ApiResponse(200, { deals }, "Deals fetched successfully"));

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch deals" });
    }
};

const getParticularDeal = async (req: Request, res: Response) => {
    try {
        const { criteria, value } = req.params;
        const organisationId = req.user?.organisationId;
        const userId = req.user?.userId;
        const role = req.user?.role;
        const ALLOWED_DEAL_SEARCH_FIELDS = ["id", "clientId", "dealOrganisation", "client", "author"] as const;
        type DealSearchField = typeof ALLOWED_DEAL_SEARCH_FIELDS[number];

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const isOwnerOrAdmin = role === "Owner" || role === "Admin";
        if (!ALLOWED_DEAL_SEARCH_FIELDS.includes(criteria as DealSearchField)) {
            throw new ApiError(400, "Invalid search criteria");
        }

        let whereClause: any = {
            dealOrganisation: organisationId,
            ...(isOwnerOrAdmin ? {} : { authorId: userId }),
        };

        if (criteria === "client") {
            whereClause.client = {
                name: {
                    contains: value,
                    mode: "insensitive"
                }
            };
        } else if (criteria === "author") {
            whereClause.author = {
                name: {
                    contains: value,
                    mode: "insensitive"
                }
            };
        } else {
            whereClause[criteria] = value;
        }

        const deal = await prisma.deal.findFirst({
            where: whereClause,
            include: {
                client: true,
                author: { select: { id: true, name: true, email: true } },
                notes: { include: { author: { select: { id: true, name: true } }, media: true } },
                media: true,
                reminders: true,
            },
        });

        if (!deal) {
            throw new ApiError(404, "Deal not found");
        }

        return res.status(200).json(new ApiResponse(200, { deal }, "Deal details fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch deal details" });
    }
};

const updateDeal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, estimatedCost, stateOfDeal, currency, scheduled, clientId, authorId } = req.body;
        const organisationId = req.user?.organisationId;
        const role = req.user?.role;
        const userId = req.user?.userId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingDeal = await prisma.deal.findFirst({
            where: { id, dealOrganisation: organisationId },
        });

        if (!existingDeal) {
            throw new ApiError(404, "Deal not found or unauthorized");
        }

        const isOwnerOrAdmin = (role === "Owner" || role === "Admin");

        // Employees may only update deals they authored
        if (!isOwnerOrAdmin && existingDeal.authorId !== userId) {
            throw new ApiError(403, "You can only update deals you authored");
        }

        const updatedDeal = await prisma.deal.update({
            where: { id },
            data: {
                ...(amount !== undefined && { amount }),
                ...(estimatedCost !== undefined && { estimatedCost }),
                ...(stateOfDeal && { stateOfDeal: stateOfDeal as State }),
                ...(currency && { currency }),
                ...(scheduled !== undefined && { scheduled: scheduled ? new Date(scheduled) : null }),
                ...(clientId !== undefined && { clientId }),
                // reassigning the deal's author is Owner/Admin-only — silently
                // ignored (not applied) if an Employee sends it
                ...(isOwnerOrAdmin && authorId !== undefined && { authorId }),
            },
            include: { client: true, author: { select: { id: true, name: true } } },
        });

        return res.status(200).json(new ApiResponse(200, { deal: updatedDeal }, "Deal updated successfully"));

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update deal" });
    }
};

const deleteDeal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;
        const role = req.user?.role;
        const userId = req.user?.userId;
        const isOwnerOrAdmin = role === "Owner" || role === "Admin";

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingDeal = await prisma.deal.findFirst({
            where: { id, dealOrganisation: organisationId, ...(isOwnerOrAdmin ? {} : { authorId: userId }) },
        });

        if (!existingDeal) {
            throw new ApiError(404, "Deal not found or unauthorized");
        }

        // Owner/Admin can delete any deal in the org; Employees only their own
        if (!isOwnerOrAdmin && existingDeal.authorId !== userId) {
            throw new ApiError(403, "You can only delete deals you authored");
        }

        await prisma.deal.delete({ where: { id } });

        return res.status(200).json(new ApiResponse(200, {}, "Deal deleted successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to delete deal" });
    }
};

export { createDeal, getDeals, getParticularDeal, updateDeal, deleteDeal };