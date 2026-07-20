import { Router } from "express";
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
} from "../../controller/client/controller.client.js";
import { verification } from "../../controller/login and register/controller.active.js";

export const clientRouter = Router();

clientRouter.use(verification);

clientRouter.route("/").post(createClient).get(getClients);
clientRouter.route("/:id").get(getClientById).put(updateClient).delete(deleteClient);
