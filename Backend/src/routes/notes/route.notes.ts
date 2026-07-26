import { Router } from "express";
import {
    createNote,
    getNotesByDeal,
    updateNote,
    deleteNote,
} from "../../controller/notes/controller.notes.js";
import { verification } from "../../controller/auth/controller.active.js";

export const notesRouter = Router();

notesRouter.use(verification);

notesRouter.route("/").post(createNote);
notesRouter.route("/deal/:dealId").get(getNotesByDeal);
notesRouter.route("/:id").put(updateNote).delete(deleteNote);
