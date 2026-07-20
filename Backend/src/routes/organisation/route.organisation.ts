import { Router } from "express";
import {
    getOrganisationDetails,
    generateInviteToken,
    getOrganisationMembers,
    removeMember,
} from "../../controller/organisation/controller.organisation.js";
import { verification } from "../../controller/login and register/controller.active.js";

export const organisationRouter = Router();

organisationRouter.use(verification);

organisationRouter.route("/").get(getOrganisationDetails);
organisationRouter.route("/invite-token").post(generateInviteToken);
organisationRouter.route("/members").get(getOrganisationMembers);
organisationRouter.route("/members/:memberId").delete(removeMember);
