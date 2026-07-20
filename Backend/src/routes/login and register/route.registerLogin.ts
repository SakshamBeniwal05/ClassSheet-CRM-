import { Router } from "express";
import {
    registerWithNewOrganisation,
    newUserRegistration,
    joinOrganisation,
    userOwnerWithoutOrg,
} from "../../controller/login and register/controller.registration.js";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    verification,
} from "../../controller/login and register/controller.active.js";

export const registerLoginRouter = Router();

// Public auth routes
registerLoginRouter.route("/registerWithNewOrganisation").post(registerWithNewOrganisation);
registerLoginRouter.route("/newUserRegistration").post(newUserRegistration);
registerLoginRouter.route("/login").post(loginUser);
registerLoginRouter.route("/refresh").post(refreshAccessToken);

// Authenticated auth routes
registerLoginRouter.route("/userOwnnerWithoutOrg").post(verification, userOwnerWithoutOrg);
registerLoginRouter.route("/joinOrganisation").post(verification, joinOrganisation);
registerLoginRouter.route("/logout").post(verification, logoutUser);
