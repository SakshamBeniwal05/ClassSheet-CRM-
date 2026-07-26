import { Router } from "express";
import {
    createDeal,
    getDeals,
    getParticularDeal,
    updateDeal,
    deleteDeal,
} from "../../controller/deal/controller.deal.js";
import { verification } from "../../controller/auth/controller.active.js";

export const dealRouter = Router();

dealRouter.use(verification);

dealRouter.route("/").post(createDeal).get(getDeals);
dealRouter.route("/:id").get(getParticularDeal).put(updateDeal).delete(deleteDeal);
