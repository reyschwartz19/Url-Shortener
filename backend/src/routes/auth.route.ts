import { Router } from "express";
import { loginController, registerController, logoutController, refreshController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { authLimiter, refreshLimiter } from "../middleware/rateLimiters";

const authRouter = Router();

authRouter.post("/register", registerController, authLimiter);
authRouter.post("/refresh", refreshController, refreshLimiter);
authRouter.post("/login", loginController, authLimiter);
authRouter.post("/logout", authenticateToken,logoutController);

export default authRouter;