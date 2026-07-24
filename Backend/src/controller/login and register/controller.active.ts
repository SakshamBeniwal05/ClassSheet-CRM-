import { prisma } from "../../main.js";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "../../generated/prisma/enums.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";

// -------------------------------------------------------------------------
// Shared cookie options — defined once so login/logout never drift apart
// -------------------------------------------------------------------------

export const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — should match REFRESH_TOKEN_EXPIRY
};

// -------------------------------------------------------------------------
// Token helpers
// -------------------------------------------------------------------------

// Access token: SHORT-lived, carries role/org, sent in JSON body,
// read/attached manually by the frontend on every request (Authorization header).
// Re-fetches the user from DB so role/org are always current at mint time.
const newAccessToken = async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user?.refreshToken) {
        throw new ApiError(401, "Session expired, please log in again");
    }

    const accessToken: string = jwt.sign(
        { userId: user.id, role: user.role, organisationId: user.organisationId },
        process.env.ACCESS_TOKEN_VALUE as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"] }
    );

    return accessToken;
};

// Refresh token: LONG-lived, minimal payload (just enough to identify the user),
// stored in DB, sent ONLY via httpOnly cookie.
// NOTE: currently stored in DB as plaintext — worth hashing before storing (like a
// password) once you're past the "get it working" stage, so a DB leak doesn't hand
// out every active session directly.
export const newLoginTokens = async (user: { id: string; role: Role; organisationId: string | null }) => {
    const refreshToken: string = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_VALUE as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"] }
    );

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    const accessToken = await newAccessToken(user.id);

    return { refreshToken, accessToken };
};

// -------------------------------------------------------------------------
// Shared helper — the ONLY place refresh-token verification + DB cross-check
// happens. Used exclusively by `verification` below. Not exposed as its own
// route: this project doesn't need proactive/explicit refresh right now —
// `verification` already handles the one case that matters (access token
// expires mid-use, gets silently refreshed inline, original request continues).
// -------------------------------------------------------------------------

const getNewAccessTokenFromRefreshCookie = async (refreshTokenCookie: string | undefined) => {
    if (!refreshTokenCookie) {
        throw new ApiError(401, "No refresh token, please log in again");
    }

    let decoded: { userId: string };
    try {
        decoded = jwt.verify(
            refreshTokenCookie,
            process.env.REFRESH_TOKEN_VALUE as string
        ) as { userId: string };
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token, please log in again");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    // The token stored in DB must match the one presented — if a user logged
    // out (or logged in elsewhere, overwriting it), this cookie is now stale
    // even if the JWT itself would still technically verify.
    if (!user || user.refreshToken !== refreshTokenCookie) {
        throw new ApiError(401, "Session expired, please log in again");
    }

    const accessToken = await newAccessToken(user.id);
    return { accessToken, user };
};

// -------------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------------

const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }

        const user = await prisma.user.findFirst({ where: { email } });

        // Deliberately identical message for "no such email" and "wrong password" —
        // prevents leaking which emails are registered.
        if (!user) {
            throw new ApiError(401, "Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid email or password");
        }

        const { refreshToken, accessToken } = await newLoginTokens(user);

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, refreshCookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            organisationId: user.organisationId,
                        },
                    },
                    "Logged in successfully"
                )
            );
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
};

const logoutUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            throw new ApiError(401, "Not authenticated");
        }

        await prisma.user.update({
            where: { id: req.user.userId },
            data: { refreshToken: null },
        });

        return res
            .status(200)
            .clearCookie("refreshToken", refreshCookieOptions) // was "accessToken" — access token was never a cookie
            .json(new ApiResponse(200, {}, "Logged out successfully"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
};

// -------------------------------------------------------------------------
// Middleware — verifies the access token; if it's specifically EXPIRED
// (not tampered/invalid), silently refreshes inline using the shared helper
// and lets the original request continue. This is the single place the
// refresh-token flow lives — no separate /refresh-token endpoint needed.
// -------------------------------------------------------------------------

const verification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized request: no token provided" });
        }

        const token = authHeader.split(" ")[1];

        try {
            // ---- happy path: access token is still valid ----
            const decoded = jwt.verify(token as string, process.env.ACCESS_TOKEN_VALUE as string) as { userId: string, role: Role, organisationId: string }


            req.user = {
                userId: decoded.userId,
                role: decoded.role,
                organisationId: decoded.organisationId,
            };
            return next();

        } catch (err) {
            // ---- only attempt silent refresh if it expired, not if it's invalid/tampered ----
            if (!(err instanceof jwt.TokenExpiredError)) {
                return res.status(401).json({ error: "Invalid access token" });
            }

            try {
                const { accessToken, user } = await getNewAccessTokenFromRefreshCookie(
                    req.cookies?.refreshToken
                );

                // hand the new token back so the frontend can update what it stores,
                // without needing a separate manual refresh call
                res.setHeader("x-access-token", accessToken);

                req.user = { userId: user.id, role: user.role, organisationId: user.organisationId };
                return next(); // ✅ the ORIGINAL protected route still runs
            } catch (refreshError) {
                if (refreshError instanceof ApiError) {
                    return res.status(400).json({ error: refreshError.message });
                }
                return res.status(401).json({ error: "Session expired, please log in again" });
            }
        }

    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired access token" });
    }
};

export { loginUser, logoutUser, verification };