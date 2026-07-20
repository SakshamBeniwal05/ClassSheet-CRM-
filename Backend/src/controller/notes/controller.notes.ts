import type { Request, Response } from "express";
import { prisma } from "../login and register/controller.registration.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";

const createNote = async (req: Request, res: Response) => {
    try {
        const { title, body, dealId, status } = req.body;
        const authorId = req.user?.userId;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        if (!title || !body || !dealId) {
            throw new ApiError(400, "Title, body, and dealId are required");
        }

        const deal = await prisma.deal.findFirst({
            where: { id: dealId, dealOrganisation: organisationId },
        });

        if (!deal) {
            throw new ApiError(404, "Deal not found or unauthorized");
        }

        const note = await prisma.note.create({
            data: {
                title,
                body,
                dealId,
                authorId: authorId || null,
                status: status || null,
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });

        return res.status(201).json(new ApiResponse(201, { note }, "Note created successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create note" });
    }
};

const getNotesByDeal = async (req: Request, res: Response) => {
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

        const notes = await prisma.note.findMany({
            where: { dealId },
            include: {
                author: { select: { id: true, name: true, email: true } },
                media: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json(new ApiResponse(200, { notes }, "Notes fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch notes" });
    }
};

const updateNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, body, status } = req.body;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingNote = await prisma.note.findFirst({
            where: { id, deal: { dealOrganisation: organisationId } },
        });

        if (!existingNote) {
            throw new ApiError(404, "Note not found or unauthorized");
        }

        const updatedNote = await prisma.note.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(body && { body }),
                ...(status !== undefined && { status }),
            },
        });

        return res.status(200).json(new ApiResponse(200, { note: updatedNote }, "Note updated successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update note" });
    }
};

const deleteNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            throw new ApiError(403, "User must belong to an organisation");
        }

        const existingNote = await prisma.note.findFirst({
            where: { id, deal: { dealOrganisation: organisationId } },
        });

        if (!existingNote) {
            throw new ApiError(404, "Note not found or unauthorized");
        }

        await prisma.note.delete({ where: { id } });

        return res.status(200).json(new ApiResponse(200, {}, "Note deleted successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to delete note" });
    }
};

export { createNote, getNotesByDeal, updateNote, deleteNote };
