import { Router } from "express";
import { createLinkController, deleteLinkController, getUserLinksController, redirectLinkController } from "../controllers/link.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { createLinkLimiter, redirectCodeLimiter, redirectIpLimiter } from "../middleware/rateLimiters";

const linkRouter = Router();

linkRouter.post("/createLink", authenticateToken, createLinkController , createLinkLimiter);
linkRouter.delete("/:linkId", authenticateToken, deleteLinkController);
linkRouter.get("/userLinks", authenticateToken, getUserLinksController);
linkRouter.get("/:shortCode", redirectLinkController, redirectCodeLimiter, redirectIpLimiter);

export default linkRouter;