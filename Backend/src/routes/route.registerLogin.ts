import { Router } from "express";
import { joinOrganisation, newUserRegistration, registerWithNewOrganisation, userOwnerWithoutOrg } from "../controller/auth/controller.registration.js";

export const registerLoginRouter = Router()

registerLoginRouter.route('/registerWithNewOrganisation').post(registerWithNewOrganisation)
registerLoginRouter.route('/newUserRegistration').post(newUserRegistration)
registerLoginRouter.route('/userOwnnerWithoutOrg').post(userOwnerWithoutOrg)
registerLoginRouter.route('/joinOrganisation').post(joinOrganisation)