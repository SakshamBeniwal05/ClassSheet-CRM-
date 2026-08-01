import e, { type Application, type Request, type Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"

dotenv.config();

const app: Application = e();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(e.json({ limit: "16kb" }));
app.use(e.urlencoded({ extended: true, limit: "16kb" }));
app.use(e.static("public"));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ENV,
    credentials: true
}))


// Pass the adapter instance to PrismaClient
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Routers

import { registerLoginRouter } from "./routes/login and register/route.registerLogin.js";
import { clientRouter } from "./routes/client/route.client.js";
import { dealRouter } from "./routes/deal/route.deal.js";
import { organisationRouter } from "./routes/organisation/route.organisation.js";
import { notesRouter } from "./routes/notes/route.notes.js";
import { mediaRouter } from "./routes/media/route.media.js";
import { reminderRouter } from "./routes/reminder/route.reminder.js";


app.use("/api/auth", registerLoginRouter);
app.use("/api", registerLoginRouter); // Backward compatibility
app.use("/api/clients", clientRouter);
app.use("/api/deals", dealRouter);
app.use("/api/organisation", organisationRouter);
app.use("/api/notes", notesRouter);
app.use("/api/media", mediaRouter);
app.use("/api/reminders", reminderRouter);

app.get("/", (req: Request, res: Response) => {
    res.json("server is running");
});

app.listen(port, () => {
    console.log("server is running");
});

export {prisma}