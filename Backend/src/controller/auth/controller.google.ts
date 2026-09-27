import nodemailer from "nodemailer";
import ApiError from "../../utils/utils.api.error.js";

const getTransporter = () => {
    console.log("[GOOGLE MAIL] Initializing email transporter...");
    if (process.env.GOOGLE_APP_PASSWORD) {
        console.log("[GOOGLE MAIL] Using Gmail with GOOGLE_APP_PASSWORD authentication.");
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_USER,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });
    }
    console.log("[GOOGLE MAIL] Using Gmail with OAuth2 credentials.");
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.GOOGLE_USER,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        },
    });
};

const sendMail = async (reciverMail: string, subject: string, text: string) => {
    console.log("[GOOGLE MAIL:sendMail] Step 1: Starting mail dispatch process.");
    console.log("--------------------------------------------------");
    console.log(`[AUTH EMAIL] Recipient: ${reciverMail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log("--------------------------------------------------");

    try {
        console.log("[GOOGLE MAIL:sendMail] Step 2: Creating transporter instance...");
        const transporter = getTransporter();
        console.log("[GOOGLE MAIL:sendMail] Step 3: Sending email via transporter...");
        const mail = await transporter.sendMail({
            from: `"Dhyani Vaidh" <${process.env.GOOGLE_USER}>`,
            to: reciverMail,
            subject,
            text,
        });
        console.log("[GOOGLE MAIL:sendMail] Step 4: Email dispatched successfully. Response:", mail.messageId || mail);

        console.log("[GOOGLE MAIL:sendMail] Step 5: Checking if recipient was rejected...");
        if (mail.rejected && mail.rejected.includes(reciverMail)) {
            console.error(`[GOOGLE MAIL:sendMail] Recipient ${reciverMail} was rejected by provider`);
            throw new ApiError(400, "Email address was rejected by mail provider");
        }
        console.log("[GOOGLE MAIL:sendMail] Step 6: Mail sending completed with no rejections.");
    } catch (error) {
        console.error("[GOOGLE MAIL:sendMail] Nodemailer sendMail encountered an error:", error);
        if (error instanceof ApiError) throw error;

        // In development, do not block the user if Gmail OAuth token expired.
        // The OTP is logged to the console so developers can proceed with testing.
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[DEV WARNING] Email delivery failed (${(error as any)?.message || error}). Continuing registration using console OTP fallback.`);
            return;
        }

        console.error("[GOOGLE MAIL:sendMail] Throwing ApiError 500 for failed email delivery in production.");
        throw new ApiError(500, "Failed to send verification email. Please check mail credentials.");
    }
};

export default sendMail;