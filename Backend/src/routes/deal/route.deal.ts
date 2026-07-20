import { Router } from "express";
import {
    createDeal,
    getDeals,
    getDealById,
    updateDeal,
    deleteDeal,
} from "../../controller/deal/controller.deal.js";
import { verification } from "../../controller/login and register/controller.active.js";

export const dealRouter = Router();

dealRouter.use(verification);

dealRouter.route("/").post(createDeal).get(getDeals);
dealRouter.route("/:id").get(getDealById).put(updateDeal).delete(deleteDeal);
