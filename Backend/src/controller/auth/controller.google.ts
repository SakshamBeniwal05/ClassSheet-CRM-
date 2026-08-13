import nodemailer from "nodemailer";
import ApiError from "../../utils/utils.api.error.js";
import type { Request, Response } from "express";

const transporter = nodemailer.createTransport(
    {
        service: "gmail", auth: {
            type: "OAuth2",
            user: process.env.GOOGLE_USER,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN
        }
    }
)

const sendMail = async (req: Request, res: Response) => {
    try {
        const mail = await transporter.sendMail({
            from: `"Dhyani Vaidh" <process.env.GOOGLE_USER>`,
            to: "priyanshu22600@gmail.com",
            subject: "coke studio",
            text: "hello, saksham this side i m currently developing email otp sandsign servicw so if u rewcive ping me back"
        })
        console.log(mail);

        if (!mail.rejected || mail.rejected.length === 0) {
            return res.status(200).json({ message: "OTP SENT" });
        }

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, "Cant create registerUser")
    }
}

export default sendMail