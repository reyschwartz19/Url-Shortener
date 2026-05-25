import express  from "express";
import "dotenv/config"
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import linkRouter from "./routes/link.route";
import clickRouter from "./routes/click.route";
import { errorHandler } from "./middleware/errorHandler";
import { ENV } from "./config/env";
import { redis } from "./config/redis";
import { Request, Response } from "express";



const app = express();

const port = ENV.PORT;
const replicaApp = process.env.APP_NAME ;

app.use(cors(
    {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter)
app.use("/api/links", linkRouter)
app.use("/api/clicks", clickRouter)

app.get("/", (req: Request, res: Response) => {
    res.send(`Welcome to ${replicaApp} of the URL Shortener Service!`);
})

app.use(errorHandler);

async function start() {
    await redis.connect();
    app.listen(port, () => {
        console.log(`${replicaApp} is running on port ${port}`);
    })
    
}

start();