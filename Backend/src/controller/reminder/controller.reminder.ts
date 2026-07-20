import type { Request, Response } from "express";
import { prisma } from "../login and register/controller.registration.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";

const createReminder = async (req: Request, res: Response) => {
    try {
        const { title, description, scheduledTriggerAt, status, clientId, dealId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError(401, "Authentication required");
        }

        if (!title || !scheduledTriggerAt) {
            throw new ApiError(400, "Title and Scheduled trigger time are required");
        }

        const reminder = await prisma.reminder.create({
            data: {
                userId,
                title,
                description: description || null,
                scheduledTriggerAt: new Date(scheduledTriggerAt),
                status: status || "Pending",
                clientId: clientId || null,
                dealId: dealId || null,
            },
            include: {
                client: { select: { id: true, name: true } },
                deal: { select: { id: true, amount: true, stateOfDeal: true } },
            },
        });

        return res.status(201).json(new ApiResponse(201, { reminder }, "Reminder created successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to create reminder" });
    }
};

const getUserReminders = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { status } = req.query;

        if (!userId) {
            throw new ApiError(401, "Authentication required");
        }

        const reminders = await prisma.reminder.findMany({
            where: {
                userId,
                ...(status ? { status: String(status) } : {}),
            },
            include: {
                client: { select: { id: true, name: true } },
                deal: { select: { id: true, amount: true, stateOfDeal: true } },
            },
            orderBy: { scheduledTriggerAt: "asc" },
        });

        return res.status(200).json(new ApiResponse(200, { reminders }, "Reminders fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to fetch reminders" });
    }
};

const updateReminderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError(401, "Authentication required");
        }

        if (!status) {
            throw new ApiError(400, "Status is required");
        }

        const existingReminder = await prisma.reminder.findFirst({
            where: { id, userId },
        });

        if (!existingReminder) {
            throw new ApiError(404, "Reminder not found or unauthorized");
        }

        const updatedReminder = await prisma.reminder.update({
            where: { id },
            data: { status },
        });

        return res.status(200).json(new ApiResponse(200, { reminder: updatedReminder }, "Reminder status updated successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to update reminder status" });
    }
};

const deleteReminder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError(401, "Authentication required");
        }

        const existingReminder = await prisma.reminder.findFirst({
            where: { id, userId },
        });

        if (!existingReminder) {
            throw new ApiError(404, "Reminder not found or unauthorized");
        }

        await prisma.reminder.delete({ where: { id } });

        return res.status(200).json(new ApiResponse(200, {}, "Reminder deleted successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statuscode).json({ error: error.message });
        }
        return res.status(500).json({ error: "Failed to delete reminder" });
    }
};

export { createReminder, getUserReminders, updateReminderStatus, deleteReminder };
