import type { Request, Response } from "express";
import { prisma } from "../../main.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";

const uploadMedia = async (req: Request, res: Response) => {
    try {
        const { mediaUrl, dealId, noteId, fileName } = req.body;
        const uploaderId = req.user?.userId;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        if (!mediaUrl || !dealId) {
            throw new ApiError(400, "Media URL and Deal ID are required");
        }

        const deal = await prisma.deal.findFirst({
            where: { id: dealId, dealOrganisation: organisationId },
        });

        if (!deal) {
            throw new ApiError(404, "Deal not found or unauthorized");
        }

        const media = await prisma.media.create({
            data: {
                mediaUrl,
                dealId,
                noteId: noteId || null,
                fileName: fileName || null,
                uploaderId: uploaderId || null,
            },
            include: {
                uploader: { select: { id: true, name: true } },
            },
        });

        return res.status(201).json(new ApiResponse(201, { media }, "Media record created successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create media record" });
    }
};

const getMediaByDeal = async (req: Request, res: Response) => {
    try {
        const { dealId } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const deal = await prisma.deal.findFirst({
            where: { id: dealId, dealOrganisation: organisationId },
        });

        if (!deal) {
            throw new ApiError(404, "Deal not found or unauthorized");
        }

        const mediaList = await prisma.media.findMany({
            where: { dealId },
            include: {
                uploader: { select: { id: true, name: true } },
                note: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json(new ApiResponse(200, { media: mediaList }, "Media items fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch media items" });
    }
};

const deleteMedia = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingMedia = await prisma.media.findFirst({
            where: { id, deal: { dealOrganisation: organisationId } },
        });

        if (!existingMedia) {
            throw new ApiError(404, "Media not found or unauthorized");
        }

        await prisma.media.delete({ where: { id } });

        return res.status(200).json(new ApiResponse(200, {}, "Media record deleted successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to delete media record" });
    }
};

export { uploadMedia, getMediaByDeal, deleteMedia };
