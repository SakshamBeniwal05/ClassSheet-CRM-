import { Router } from "express";
import {
    registerWithNewOrganisation,
    newUserRegistration,
    joinOrganisation,
    userOwnerWithoutOrg,
    generateMailOTP
} from "../../controller/auth/controller.registration.js";
import {
    loginUser,
    logoutUser,
    verification,
    verifySession,
    refreshSession,
} from "../../controller/auth/controller.active.js";

export const registerLoginRouter = Router();

// Public auth routes
registerLoginRouter.route("/registerWithNewOrganisation").post(registerWithNewOrganisation);
registerLoginRouter.route("/newUserRegistration").post(newUserRegistration);
registerLoginRouter.route('/login').post(loginUser)
registerLoginRouter.route('/refresh').get(refreshSession)
registerLoginRouter.route('/registrationMail').post(generateMailOTP)
// Authenticated auth routes
registerLoginRouter.route("/userOwnnerWithoutOrg").post(verification, userOwnerWithoutOrg);
registerLoginRouter.route("/joinOrganisation").post(verification, joinOrganisation);
registerLoginRouter.route('/logout').post(verification, logoutUser)
registerLoginRouter.route('/verify').get(verification, verifySession)