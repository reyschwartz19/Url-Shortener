import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getStatsController } from "../controllers/click.controller";


const clickRouter = Router();

clickRouter.get("/:linkId/stats", authenticateToken, getStatsController);

export default clickRouter;