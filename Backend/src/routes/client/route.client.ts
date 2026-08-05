import { Router } from "express";
import {
    createClient,
    getClients,
    getParticularClient,
    updateClient,
    deleteClient,
} from "../../controller/client/controller.client.js";
import { verification } from "../../controller/auth/controller.active.js";

export const clientRouter = Router();

clientRouter.use(verification);

clientRouter.route("/").post(verification,createClient).get(verification,getClients);
clientRouter.route("/:criteria/:value").get(verification, getParticularClient);
clientRouter.route("/:id").put(verification, updateClient).delete(verification, deleteClient);
