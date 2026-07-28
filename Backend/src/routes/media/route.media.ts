import { Router } from "express";
import {
    uploadMedia,
    getMediaByDeal,
    deleteMedia,
    updateMedia,
    getUploadAuthParams,
} from "../../controller/media/controller.media.js";
import { verification } from "../../controller/auth/controller.active.js";

export const mediaRouter = Router();

mediaRouter.use(verification);

// Route to request authentication parameters for direct ImageKit upload
mediaRouter.route("/auth").get(getUploadAuthParams);
// Save media record (receives raw JSON from client, no Multer needed)
mediaRouter.route("/").post(uploadMedia);
// Fetch all media linked to a specific deal
mediaRouter.route("/deal/:dealId").get(getMediaByDeal);
// Update or delete a specific media item
mediaRouter.route("/:id").put(updateMedia).delete(deleteMedia);