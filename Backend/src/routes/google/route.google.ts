import { Router } from "express";
import sendMail from "../../controller/auth/controller.google.js";

export const googleRouter = Router();

googleRouter.route('/sendmail').get(sendMail)