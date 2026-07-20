import { Router } from "express";
import {
    createReminder,
    getUserReminders,
    updateReminderStatus,
    deleteReminder,
} from "../../controller/reminder/controller.reminder.js";
import { verification } from "../../controller/login and register/controller.active.js";

export const reminderRouter = Router();

reminderRouter.use(verification);

reminderRouter.route("/").post(createReminder).get(getUserReminders);
reminderRouter.route("/:id/status").put(updateReminderStatus);
reminderRouter.route("/:id").delete(deleteReminder);
