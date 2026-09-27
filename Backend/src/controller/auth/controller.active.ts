import { prisma } from "../../main.js";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "../../generated/prisma/enums.js";
import ApiError from "../../utils/utils.api.error.js";
import ApiResponse from "../../utils/utils.api.response.js";
import otpGenerator from "../../utils/utils.api.otp.js";
import redisClient from "../../services/redis/service.redis.js";
import sendMail from "./controller.google.js";

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
    console.log("[AUTH:newAccessToken] Step 1: Starting access token generation for userId:", id);
    console.log("[AUTH:newAccessToken] Step 2: Fetching user from database...");
    const user = await prisma.user.findUnique({ where: { id } });
    console.log("[AUTH:newAccessToken] Step 3: Checking if user exists and has an active refreshToken...");
    if (!user?.refreshToken) {
        console.error("[AUTH:newAccessToken] Validation failed: user or refreshToken not found for userId:", id);
        throw new ApiError(401, "Session expired, please log in again");
    }

    console.log("[AUTH:newAccessToken] Step 4: Signing JWT access token with payload:", {
        userId: user.id,
        role: user.role,
        organisationId: user.organisationId
    });
    const accessToken: string = jwt.sign(
        { userId: user.id, role: user.role, organisationId: user.organisationId },
        process.env.ACCESS_TOKEN_VALUE as string,
        { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "1d") as any }
    );

    console.log("[AUTH:newAccessToken] Step 5: Access token generated successfully.");
    return accessToken;
};

// Refresh token: LONG-lived, minimal payload (just enough to identify the user),
// stored in DB, sent ONLY via httpOnly cookie.
export const newLoginTokens = async (user: { id: string; role: Role; organisationId: string | null }) => {
    console.log("[AUTH:newLoginTokens] Step 1: Initiating new login tokens generation for userId:", user.id);
    console.log("[AUTH:newLoginTokens] Step 2: Signing JWT refresh token...");
    const refreshToken: string = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_VALUE as string,
        { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as any }
    );

    console.log("[AUTH:newLoginTokens] Step 3: Saving refresh token into database for user...");
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });
    console.log("[AUTH:newLoginTokens] Step 4: Stored refresh token in DB. Generating matching access token...");

    const accessToken = await newAccessToken(user.id);
    console.log("[AUTH:newLoginTokens] Step 5: Both refresh and access tokens ready.");

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
    console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 1: Checking presented refresh token cookie...");
    if (!refreshTokenCookie) {
        console.error("[AUTH:getNewAccessTokenFromRefreshCookie] Error: No refresh token cookie found");
        throw new ApiError(401, "No refresh token, please log in again");
    }

    console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 2: Verifying refresh token signature...");
    let decoded: { userId: string };
    try {
        decoded = jwt.verify(
            refreshTokenCookie,
            process.env.REFRESH_TOKEN_VALUE as string
        ) as { userId: string };
        console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 3: Refresh token verified. Decoded userId:", decoded.userId);
    } catch {
        console.error("[AUTH:getNewAccessTokenFromRefreshCookie] Error: Invalid or expired refresh token signature");
        throw new ApiError(401, "Invalid or expired refresh token, please log in again");
    }

    console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 4: Querying user from database...");
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 5: Cross-checking database refreshToken with cookie...");
    if (!user || user.refreshToken !== refreshTokenCookie) {
        console.error("[AUTH:getNewAccessTokenFromRefreshCookie] Error: Database refreshToken mismatch or user missing");
        throw new ApiError(401, "Session expired, please log in again");
    }

    console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 6: Database match confirmed. Issuing new access token...");
    const accessToken = await newAccessToken(user.id);
    console.log("[AUTH:getNewAccessTokenFromRefreshCookie] Step 7: New access token successfully issued.");
    return { accessToken, user };
};

// -------------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------------

const loginUser = async (req: Request, res: Response) => {
    console.log("[AUTH:loginUser] Step 1: Login request received.");
    try {
        const { email, password } = req.body;
        console.log("[AUTH:loginUser] Step 2: Request body parsed. Checking email and password presence...");

        if (!email || !password) {
            console.error("[AUTH:loginUser] Validation failed: missing email or password");
            throw new ApiError(400, "Email and password are required");
        }

        console.log("[AUTH:loginUser] Step 3: Querying database for user with email:", email);
        const user = await prisma.user.findFirst({ where: { email } });

        // Deliberately identical message for "no such email" and "wrong password" —
        // prevents leaking which emails are registered.
        console.log("[AUTH:loginUser] Step 4: Checking if user exists in database...");
        if (!user) {
            console.error("[AUTH:loginUser] Authentication failed: user not found for email:", email);
            throw new ApiError(401, "Invalid email or password");
        }

        console.log("[AUTH:loginUser] Step 5: Comparing password hash with bcrypt...");
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.error("[AUTH:loginUser] Authentication failed: password mismatch for user:", email);
            throw new ApiError(401, "Invalid email or password");
        }

        console.log("[AUTH:loginUser] Step 6: Credentials valid. Minting new login tokens...");
        const { refreshToken, accessToken } = await newLoginTokens(user);

        console.log("[AUTH:loginUser] Step 7: Setting refresh token cookie and returning successful response.");
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
        console.error("[AUTH:loginUser] loginUser encountered an error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Something went wrong" });
    }
};

const logoutUser = async (req: Request, res: Response) => {
    console.log("[AUTH:logoutUser] Step 1: Logout request received.");
    try {
        console.log("[AUTH:logoutUser] Step 2: Checking authentication state on req.user...");
        if (!req.user) {
            console.error("[AUTH:logoutUser] User not authenticated");
            throw new ApiError(401, "Not authenticated");
        }

        console.log("[AUTH:logoutUser] Step 3: Clearing refreshToken in database for userId:", req.user.userId);
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { refreshToken: null },
        });

        console.log("[AUTH:logoutUser] Step 4: Clearing refreshToken cookie and returning response.");
        return res
            .status(200)
            .clearCookie("refreshToken", refreshCookieOptions) // was "accessToken" — access token was never a cookie
            .json(new ApiResponse(200, {}, "Logged out successfully"));
    } catch (error) {
        console.error("[AUTH:logoutUser] logoutUser error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Something went wrong" });
    }
};

// -------------------------------------------------------------------------
// Middleware — verifies the access token; if it's specifically EXPIRED
// (not tampered/invalid), silently refreshes inline using the shared helper
// and lets the original request continue. This is the single place the
// refresh-token flow lives — no separate /refresh-token endpoint needed.
// -------------------------------------------------------------------------

const verification = async (req: Request, res: Response, next: NextFunction) => {
    console.log("[AUTH:verification] Step 1: Verification middleware triggered for path:", req.path);
    try {
        const authHeader = req.headers.authorization;
        console.log("[AUTH:verification] Step 2: Checking Authorization header...");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.warn("[AUTH:verification] Authorization header missing or malformed");
            return res.status(401).json({ error: "Unauthorized request: no token provided" });
        }

        console.log("[AUTH:verification] Step 3: Extracting token string from header...");
        const token = authHeader.split(" ")[1];

        try {
            console.log("[AUTH:verification] Step 4: Verifying JWT access token...");
            // ---- happy path: access token is still valid ----
            const decoded = jwt.verify(token as string, process.env.ACCESS_TOKEN_VALUE as string) as { userId: string, role: Role, organisationId: string };

            console.log("[AUTH:verification] Step 5: Access token valid. Attaching decoded user to req.user:", {
                userId: decoded.userId,
                role: decoded.role,
                organisationId: decoded.organisationId
            });

            req.user = {
                userId: decoded.userId,
                role: decoded.role,
                organisationId: decoded.organisationId,
            };
            console.log("[AUTH:verification] Step 6: Calling next() for route handler.");
            return next();

        } catch (err) {
            console.log("[AUTH:verification] Step 4b: Access token verification failed. Checking error type...");
            // ---- only attempt silent refresh if it expired, not if it's invalid/tampered ----
            if (!(err instanceof jwt.TokenExpiredError)) {
                console.error("[AUTH:verification] Access token is invalid or tampered (not expired):", err);
                return res.status(401).json({ error: "Invalid access token" });
            }

            console.log("[AUTH:verification] Step 4c: Access token expired. Attempting inline silent refresh from cookie...");
            try {
                const { accessToken, user } = await getNewAccessTokenFromRefreshCookie(
                    req.cookies?.refreshToken
                );

                console.log("[AUTH:verification] Step 4d: Silent refresh succeeded. Setting x-access-token response header...");
                // hand the new token back so the frontend can update what it stores,
                // without needing a separate manual refresh call
                res.setHeader("x-access-token", accessToken);

                req.user = { userId: user.id, role: user.role, organisationId: user.organisationId };
                console.log("[AUTH:verification] Step 4e: req.user updated with refreshed session. Calling next().");
                return next(); // ✅ the ORIGINAL protected route still runs
            } catch (refreshError) {
                console.error("[AUTH:verification] Silent refresh failed:", refreshError);
                if (refreshError instanceof ApiError) {
                    return res.status(400).json({ error: refreshError.message });
                }
                return res.status(401).json({ error: "Session expired, please log in again" });
            }
        }

    } catch (error) {
        console.error("[AUTH:verification] Unexpected verification error:", error);
        return res.status(401).json({ error: "Invalid or expired access token" });
    }
};

const verifySession = async (req: Request, res: Response) => {
    console.log("[AUTH:verifySession] Step 1: Session verification request received for userId:", req.user?.userId);
    try {
        console.log("[AUTH:verifySession] Step 2: Fetching user details from database...");
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                organisationId: true
            }
        });
        console.log("[AUTH:verifySession] Step 3: Checking if user exists...");
        if (!user) {
            console.error("[AUTH:verifySession] User not found for userId:", req.user?.userId);
            throw new ApiError(404, "User not found");
        }
        console.log("[AUTH:verifySession] Step 4: User verified successfully. Sending response.");
        return res.status(200).json(new ApiResponse(200, { user }, "Session verified successfully"));
    } catch (error) {
        console.error("[AUTH:verifySession] verifySession error:", error);
        if (error instanceof ApiError) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
};

const refreshSession = async (req: Request, res: Response) => {
    console.log("[AUTH:refreshSession] Step 1: Manual refresh session request received.");
    try {
        console.log("[AUTH:refreshSession] Step 2: Calling getNewAccessTokenFromRefreshCookie...");
        const { accessToken, user } = await getNewAccessTokenFromRefreshCookie(
            req.cookies?.refreshToken
        );
        console.log("[AUTH:refreshSession] Step 3: Token refreshed successfully for user:", user.email);
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        organisationId: user.organisationId
                    }
                },
                "Session refreshed successfully"
            )
        );
    } catch (error) {
        console.error("[AUTH:refreshSession] refreshSession error:", error);
        if (error instanceof ApiError) {
            return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
};

// -------------------------------------------------------------------------
// Forgot Password & Password Change Handlers (with OTP)
// -------------------------------------------------------------------------

/**
 * Step 1 of Forgot Password:
 * Validates user existence, generates 6-digit OTP, caches in Redis (10m TTL),
 * and dispatches OTP email.
 */
const forgotPasswordRequest = async (req: Request, res: Response) => {
    console.log("[AUTH:forgotPasswordRequest] Step 1: Received forgot password request.");
    try {
        const { email } = req.body;
        console.log("[AUTH:forgotPasswordRequest] Step 2: Request body received. Checking email:", email);
        if (!email || typeof email !== "string" || !email.trim()) {
            console.error("[AUTH:forgotPasswordRequest] Validation failed: email is required");
            throw new ApiError(400, "Email is required");
        }
        const trimmedEmail = email.trim();

        console.log("[AUTH:forgotPasswordRequest] Step 3: Querying database for user with email:", trimmedEmail);
        const user = await prisma.user.findFirst({ where: { email: trimmedEmail } });
        if (!user) {
            console.error("[AUTH:forgotPasswordRequest] User not found with email:", trimmedEmail);
            throw new ApiError(404, "User with this email does not exist");
        }

        console.log("[AUTH:forgotPasswordRequest] Step 4: User verified in DB. Generating 6-digit OTP...");
        const otp = otpGenerator();

        console.log("[AUTH:forgotPasswordRequest] Step 5: Storing OTP in Redis under key 'forgot_otp:" + trimmedEmail + "' with 600s TTL...");
        // Store OTP in Redis with 10-minute expiry (600 seconds)
        await redisClient.set(`forgot_otp:${trimmedEmail}`, otp, { 'EX': 600 });

        console.log("[AUTH:forgotPasswordRequest] Step 6: Dispatching OTP email via sendMail...");
        // Dispatch OTP via email (or dev terminal fallback)
        await sendMail(
            trimmedEmail,
            "Password Reset OTP",
            `Your OTP for password reset is ${otp}. This code is valid for 10 minutes.`
        );

        console.log("[AUTH:forgotPasswordRequest] Step 7: Password reset OTP dispatched successfully. Returning 200 response.");
        return res.status(200).json(
            new ApiResponse(200, null, "Password reset OTP sent to your email.")
        );
    } catch (error) {
        console.error("[AUTH:forgotPasswordRequest] forgotPasswordRequest error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Failed to process password reset request" });
    }
};

/**
 * Optional middleware: verifies that the provided OTP for password reset matches Redis.
 */
const forgotOtpVerification = async (req: Request, res: Response, next: NextFunction) => {
    console.log("[AUTH:forgotOtpVerification] Step 1: Request received in forgotOtpVerification middleware.");
    try {
        const { email, inputOtp } = req.body;
        console.log("[AUTH:forgotOtpVerification] Step 2: Body received. Checking email and inputOtp presence...");
        if (!email || !inputOtp) {
            console.error("[AUTH:forgotOtpVerification] Validation failed: email or inputOtp missing");
            throw new ApiError(400, "Email and OTP are required");
        }
        const trimmedEmail = email.trim();

        console.log("[AUTH:forgotOtpVerification] Step 3: Checking Redis for key 'forgot_otp:" + trimmedEmail + "'...");
        const storedOtp = await redisClient.get(`forgot_otp:${trimmedEmail}`);
        if (!storedOtp) {
            console.error("[AUTH:forgotOtpVerification] OTP has expired or was not requested in Redis for:", trimmedEmail);
            throw new ApiError(400, "OTP has expired or was not requested");
        }

        console.log("[AUTH:forgotOtpVerification] Step 4: Comparing stored Redis OTP against inputOtp...");
        if (storedOtp !== inputOtp.toString().trim()) {
            console.error("[AUTH:forgotOtpVerification] Invalid OTP provided for email:", trimmedEmail);
            throw new ApiError(400, "Invalid OTP");
        }

        console.log("[AUTH:forgotOtpVerification] Step 5: OTP verified successfully. Proceeding to next().");
        return next();
    } catch (error) {
        console.error("[AUTH:forgotOtpVerification] forgotOtpVerification error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Something went wrong in forgotOtpVerification" });
    }
};

/**
 * Step 2 of Forgot Password:
 * Verifies OTP from Redis, hashes newPassword, updates user record in DB,
 * invalidates existing refresh token, and deletes OTP from Redis.
 */
const resetPasswordWithOTP = async (req: Request, res: Response) => {
    console.log("[AUTH:resetPasswordWithOTP] Step 1: Received reset password with OTP request.");
    try {
        const { email, inputOtp, newPassword } = req.body;
        console.log("[AUTH:resetPasswordWithOTP] Step 2: Validating email, inputOtp, and newPassword in request body...");

        if (!email || !inputOtp || !newPassword) {
            console.error("[AUTH:resetPasswordWithOTP] Validation failed: missing email, inputOtp, or newPassword");
            throw new ApiError(400, "Email, OTP, and new password are required");
        }

        const trimmedEmail = email.trim();

        console.log("[AUTH:resetPasswordWithOTP] Step 3: Validating new password length...");
        if (typeof newPassword !== "string" || newPassword.length < 6) {
            console.error("[AUTH:resetPasswordWithOTP] Validation failed: new password must be at least 6 characters");
            throw new ApiError(400, "New password must be at least 6 characters long");
        }

        console.log("[AUTH:resetPasswordWithOTP] Step 4: Retrieving stored OTP from Redis for:", trimmedEmail);
        const storedOtp = await redisClient.get(`forgot_otp:${trimmedEmail}`);
        if (!storedOtp) {
            console.error("[AUTH:resetPasswordWithOTP] OTP has expired or was not requested for:", trimmedEmail);
            throw new ApiError(400, "OTP has expired or was not requested");
        }

        console.log("[AUTH:resetPasswordWithOTP] Step 5: Comparing stored OTP with inputOtp...");
        if (storedOtp !== inputOtp.toString().trim()) {
            console.error("[AUTH:resetPasswordWithOTP] Invalid OTP provided for email:", trimmedEmail);
            throw new ApiError(400, "Invalid OTP");
        }

        console.log("[AUTH:resetPasswordWithOTP] Step 6: Querying user from database...");
        const user = await prisma.user.findFirst({ where: { email: trimmedEmail } });
        if (!user) {
            console.error("[AUTH:resetPasswordWithOTP] User not found for email:", trimmedEmail);
            throw new ApiError(404, "User not found");
        }

        console.log("[AUTH:resetPasswordWithOTP] Step 7: Hashing new password with bcrypt...");
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log("[AUTH:resetPasswordWithOTP] Step 8: Updating user passwordHash and clearing refreshToken in DB...");
        // Update password and clear existing refresh tokens so active sessions are terminated
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                refreshToken: null,
            },
        });

        console.log("[AUTH:resetPasswordWithOTP] Step 9: Deleting used OTP from Redis...");
        // Clean up OTP in Redis
        await redisClient.del(`forgot_otp:${trimmedEmail}`);

        console.log("[AUTH:resetPasswordWithOTP] Step 10: Password reset process completed successfully.");
        return res.status(200).json(
            new ApiResponse(200, null, "Password reset successfully. Please log in with your new password.")
        );
    } catch (error) {
        console.error("[AUTH:resetPasswordWithOTP] resetPasswordWithOTP error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Failed to reset password" });
    }
};

/**
 * Authenticated Password Change:
 * For logged-in users who know their current password.
 */
const changePassword = async (req: Request, res: Response) => {
    console.log("[AUTH:changePassword] Step 1: Change password request received from authenticated user.");
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.userId;
        console.log("[AUTH:changePassword] Step 2: Checking userId from authenticated session:", userId);

        if (!userId) {
            console.error("[AUTH:changePassword] Not authenticated");
            throw new ApiError(401, "Not authenticated");
        }

        console.log("[AUTH:changePassword] Step 3: Checking oldPassword and newPassword presence...");
        if (!oldPassword || !newPassword) {
            console.error("[AUTH:changePassword] Validation failed: oldPassword or newPassword missing");
            throw new ApiError(400, "Current password and new password are required");
        }

        console.log("[AUTH:changePassword] Step 4: Validating newPassword minimum length...");
        if (typeof newPassword !== "string" || newPassword.length < 6) {
            console.error("[AUTH:changePassword] Validation failed: new password must be at least 6 characters long");
            throw new ApiError(400, "New password must be at least 6 characters long");
        }

        console.log("[AUTH:changePassword] Step 5: Querying user from database for userId:", userId);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.error("[AUTH:changePassword] User not found for userId:", userId);
            throw new ApiError(404, "User not found");
        }

        console.log("[AUTH:changePassword] Step 6: Validating oldPassword with bcrypt.compare...");
        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            console.error("[AUTH:changePassword] Validation failed: incorrect current password");
            throw new ApiError(400, "Incorrect current password");
        }

        console.log("[AUTH:changePassword] Step 7: Hashing new password with bcrypt...");
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log("[AUTH:changePassword] Step 8: Updating user passwordHash in database...");
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
            },
        });

        console.log("[AUTH:changePassword] Step 9: Password successfully updated in database.");
        return res.status(200).json(
            new ApiResponse(200, null, "Password changed successfully")
        );
    } catch (error) {
        console.error("[AUTH:changePassword] changePassword error:", error);
        if (error instanceof ApiError) {
            return res.status(error.statuscode || 400).json({ error: error.message });
        }
        return res.status(500).json({ error: (error as any)?.message || "Failed to change password" });
    }
};

export {
    loginUser,
    logoutUser,
    verification,
    verifySession,
    refreshSession,
    forgotPasswordRequest,
    forgotOtpVerification,
    resetPasswordWithOTP,
    changePassword,
};