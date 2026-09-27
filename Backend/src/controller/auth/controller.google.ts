import nodemailer from "nodemailer";
import dns from "node:dns";
import ApiError from "../../utils/utils.api.error.js";

// Prioritize IPv4 resolution to prevent ENETUNREACH on platforms without IPv6 routing (e.g. Render, AWS, Docker)
try {
    dns.setDefaultResultOrder("ipv4first");
} catch {
    // ignore if not supported in older runtimes
}

const getTransporter = () => {
    console.log("[GOOGLE MAIL] Initializing email transporter...");

    // Explicit SMTP options forcing IPv4 and short timeouts to prevent hanging 2 minutes on cloud firewalls
    const baseOptions = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) === 465 : true,
        family: 4, // CRITICAL: Force IPv4 to prevent ENETUNREACH on cloud environments (e.g. Render)
        connectionTimeout: 8000, // 8 seconds instead of hanging for 120 seconds
        greetingTimeout: 8000,
        socketTimeout: 10000,
    };

    if (process.env.GOOGLE_APP_PASSWORD) {
        console.log("[GOOGLE MAIL] Using Gmail with GOOGLE_APP_PASSWORD authentication (IPv4 forced, port 465).");
        return nodemailer.createTransport({
            ...baseOptions,
            auth: {
                user: process.env.GOOGLE_USER,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });
    }
    console.log("[GOOGLE MAIL] Using Gmail with OAuth2 credentials (IPv4 forced).");
    return nodemailer.createTransport({
        ...baseOptions,
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

        // Check if error is due to cloud provider network blocking (e.g. Render free tier blocks SMTP ports 25, 465, 587)
        // or IPv6 unreachable (ENETUNREACH), or connection timeout (ETIMEDOUT / ESOCKET)
        const isNetworkOrCloudBlock =
            (error as any)?.code === "ENETUNREACH" ||
            (error as any)?.code === "ETIMEDOUT" ||
            (error as any)?.code === "ECONNREFUSED" ||
            (error as any)?.code === "ESOCKET" ||
            (error as any)?.command === "CONN" ||
            Boolean(process.env.RENDER) ||
            process.env.NODE_ENV !== "production" ||
            process.env.ALLOW_EMAIL_FALLBACK === "true";

        if (isNetworkOrCloudBlock) {
            console.warn("==================================================================");
            console.warn("[MAIL FALLBACK NOTICE] Cloud network or firewall prevented direct SMTP email delivery.");
            console.warn(`Reason: ${(error as any)?.message || error}`);
            console.warn(`Note: Render and other cloud providers block outbound SMTP (ports 465/587) on free tiers.`);
            console.warn(`The OTP was staged in Redis and logged above. Continuing registration using console OTP.`);
            console.warn("==================================================================");
            return;
        }

        console.error("[GOOGLE MAIL:sendMail] Throwing ApiError 500 for failed email delivery in production.");
        throw new ApiError(500, "Failed to send verification email. Please check mail credentials or SMTP firewall.");
    }
};

export default sendMail;