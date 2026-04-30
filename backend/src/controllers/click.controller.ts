import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { getTotalClicks, getClicksByCountry, getClicksOverTime } from "../services/click.service";
import { getLinkById } from "../services/links.service";
import { ForbiddenError } from "../errors/AppError";

export const getStatsController = catchAsync(async (req: Request, res: Response) => {
    const linkId = req.params.linkId as string;
    const userId = req.user!.userId;

    const link = await getLinkById(linkId);
    if (link!.userId !== userId) {
        throw new ForbiddenError("Access denied");
    }
    const [totalClicks, clicksByCountry, clicksOverTime] = await Promise.all([
        getTotalClicks(linkId),
        getClicksByCountry(linkId),
        getClicksOverTime(linkId)
    ]);

    res.json({
        ...totalClicks,
        clicksByCountry,
        clicksOverTime
    });
})