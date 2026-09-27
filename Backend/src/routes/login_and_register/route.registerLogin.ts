import { Router } from "express";
import {
    registerWithNewOrganisation,
    newUserRegistration,
    joinOrganisation,
    userOwnerWithoutOrg,
    generateMailOTP,
    registerVerification,
    otpVerification,
} from "../../controller/auth/controller.registration.js";
import {
    loginUser,
    logoutUser,
    verification,
    verifySession,
    refreshSession,
    forgotPasswordRequest,
    forgotOtpVerification,
    resetPasswordWithOTP,
    changePassword,
} from "../../controller/auth/controller.active.js";

export const registerLoginRouter = Router();

// Public auth routes
registerLoginRouter.route("/registerVerification").post(registerVerification);
registerLoginRouter.route("/registrationMail").post(generateMailOTP);
registerLoginRouter.route("/registerWithNewOrganisation").post(registerVerification, otpVerification, registerWithNewOrganisation);
registerLoginRouter.route("/newUserRegistration").post(registerVerification, otpVerification, newUserRegistration);
registerLoginRouter.route('/login').post(loginUser);
registerLoginRouter.route('/refresh').get(refreshSession);

// Password recovery routes
registerLoginRouter.route("/forgotPassword").post(forgotPasswordRequest);
registerLoginRouter.route("/resetPassword").post(forgotOtpVerification, resetPasswordWithOTP);

// Authenticated auth routes
registerLoginRouter.route("/changePassword").post(verification, changePassword);
registerLoginRouter.route("/userOwnnerWithoutOrg").post(verification, userOwnerWithoutOrg);
registerLoginRouter.route("/joinOrganisation").post(verification, joinOrganisation);
registerLoginRouter.route('/logout').post(verification, logoutUser);
registerLoginRouter.route('/verify').get(verification, verifySession);