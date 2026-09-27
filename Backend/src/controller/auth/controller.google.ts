import nodemailer from "nodemailer";
import ApiError from "../../utils/utils.api.error.js";

const getTransporter = () => {
    if (process.env.GOOGLE_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_USER,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });
    }
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
    console.log("--------------------------------------------------");
    console.log(`[AUTH EMAIL] Recipient: ${reciverMail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log("--------------------------------------------------");

    try {
        const transporter = getTransporter();
        const mail = await transporter.sendMail({
            from: `"Dhyani Vaidh" <${process.env.GOOGLE_USER}>`,
            to: reciverMail,
            subject,
            text,
        });
        console.log("Email dispatched successfully:", mail.messageId || mail);

        if (mail.rejected && mail.rejected.includes(reciverMail)) {
            throw new ApiError(400, "Email address was rejected by mail provider");
        }
    } catch (error) {
        console.error("Nodemailer sendMail failed:", error);
        if (error instanceof ApiError) throw error;

        // In development, do not block the user if Gmail OAuth token expired.
        // The OTP is logged to the console so developers can proceed with testing.
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[DEV WARNING] Email delivery failed (${(error as any)?.message || error}). Continuing registration using console OTP fallback.`);
            return;
        }

        throw new ApiError(500, "Failed to send verification email. Please check mail credentials.");
    }
};

export default sendMail;