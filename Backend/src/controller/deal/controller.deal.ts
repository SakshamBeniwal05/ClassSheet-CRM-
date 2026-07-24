import type { Request, Response } from "express";
import type { State } from "../../generated/prisma/enums.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";
import { prisma } from "../../main.js";

const createDeal = async (req: Request, res: Response) => {
    try {
        const { clientMail, amount, estimatedCost, stateOfDeal, currency, scheduled } = req.body;
        const authorId = req.user?.userId;
        const organisationId = req.user?.organisationId;
        const clientId = await prisma.client.findFirst({where:{email:clientMail},select:{id:true}})

        if(clientId){
            throw new ApiError(400,"Client Doesnt Exist on this maill")
        }

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation to create deals");
        }

        if (!amount || !stateOfDeal) {
            throw new ApiError(400, "Amount and State of deal are required");
        }

        const deal = await prisma.deal.create({
            data: {
                clientId: clientId || null,
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
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create deal" });
    }
};

const getDeals = async (req: Request, res: Response) => {
    try {
        const organisationId = req.user?.organisationId;
        const { state } = req.query;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation to view deals");
        }

        const deals = await prisma.deal.findMany({
            where: {
                dealOrganisation: organisationId,
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
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch deals" });
    }
};

const getDealById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const deal = await prisma.deal.findFirst({
            where: { id, dealOrganisation: organisationId },
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
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch deal details" });
    }
};

const updateDeal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, estimatedCost, stateOfDeal, currency, scheduled, clientId } = req.body;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingDeal = await prisma.deal.findFirst({
            where: { id, dealOrganisation: organisationId },
        });

        if (!existingDeal) {
            throw new ApiError(404, "Deal not found or unauthorized");
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
            },
            include: { client: true, author: { select: { id: true, name: true } } },
        });

        return res.status(200).json(new ApiResponse(200, { deal: updatedDeal }, "Deal updated successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update deal" });
    }
};

const deleteDeal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingDeal = await prisma.deal.findFirst({
            where: { id, dealOrganisation: organisationId },
        });

        if (!existingDeal) {
            throw new ApiError(404, "Deal not found or unauthorized");
        }

        await prisma.deal.delete({ where: { id } });

        return res.status(200).json(new ApiResponse(200, {}, "Deal deleted successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to delete deal" });
    }
};

export { createDeal, getDeals, getDealById, updateDeal, deleteDeal };
