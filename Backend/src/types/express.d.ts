import type { Role } from "../generated/prisma/enums.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id?: string;
                userId: string;
                role: Role | string;
                organisationId?: string | null;
                [key: string]: any;
            } | any;
        }
    }
}

export {};
