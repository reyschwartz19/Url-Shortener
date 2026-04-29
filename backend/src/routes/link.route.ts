import { Router } from "express";
import { createLinkController, deleteLinkController, getUserLinksController, redirectLinkController } from "../controllers/link.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const linkRouter = Router();

linkRouter.post("/createLink", authenticateToken, createLinkController);
linkRouter.delete("/:linkId", authenticateToken, deleteLinkController);
linkRouter.get("/userLinks", authenticateToken, getUserLinksController);
linkRouter.get("/:shortCode", redirectLinkController);

export default linkRouter;