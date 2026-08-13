import nodemailer from "nodemailer";
import ApiError from "../../utils/utils.api.error.js";

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

const sendMail = async (reciverMail:string, subject: string, text:string) => {
    try {
        const mail = await transporter.sendMail({
            from: `"Dhyani Vaidh" <process.env.GOOGLE_USER>`,
            to: reciverMail,
            subject,
            text,
        })
        console.log(mail);

        if (mail.rejected && mail.rejected.includes(reciverMail)) {
            throw new ApiError(400, "Email address rejected");
        }

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, "Cant create registerUser")
    }
}

export default sendMail