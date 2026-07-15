import e, {} from "express";
import dotenv from "dotenv";
dotenv.config();
const app = e();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.get('/', (req, res) => {
    res.json("server is running");
});
app.listen(port, () => {
    console.log("server is running");
});
//# sourceMappingURL=main.js.map