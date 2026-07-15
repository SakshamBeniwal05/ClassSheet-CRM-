import e, { type Application, type Request, type Response } from "express";
import dotenv from "dotenv"

dotenv.config()
const app:Application = e()
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.get('/',(req:Request ,res:Response)=>{
    res.json("server is running")
})
app.listen(port,()=>{
    console.log("server is running");
    
})