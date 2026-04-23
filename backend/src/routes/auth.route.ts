import { Router } from "express";
import { loginController, registerController, logoutController, refreshController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/refresh", refreshController);
authRouter.post("/login", loginController);
authRouter.post("/logout", authenticateToken,logoutController);

export default authRouter;