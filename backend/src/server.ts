import express  from "express";
import "dotenv/config"
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import linkRouter from "./routes/link.route";
import clickRouter from "./routes/click.route";
import { errorHandler } from "./middleware/errorHandler";
import { ENV } from "./config/env";



const app = express();

const port = ENV.PORT;

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

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})