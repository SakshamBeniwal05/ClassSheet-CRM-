import { Router } from "express";
import {
    uploadMedia,
    getMediaByDeal,
    deleteMedia,
} from "../../controller/media/controller.media.js";
import { verification } from "../../controller/login and register/controller.active.js";

export const mediaRouter = Router();

mediaRouter.use(verification);

mediaRouter.route("/").post(uploadMedia);
mediaRouter.route("/deal/:dealId").get(getMediaByDeal);
mediaRouter.route("/:id").delete(deleteMedia);
