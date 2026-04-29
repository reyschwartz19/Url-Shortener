import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { createShortLink, deleteLink, getLinkByShortCode, getUserLinks } from "../services/links.service";
import { createLinkSchema } from "../schema/link.schema";

export const createLinkController = catchAsync(async(req: Request, res: Response) => {
    const userId = req.user!.userId;
    const input = createLinkSchema.parse(req.body);
    const link = await createShortLink(input, userId);
    res.status(201).json(link);
})

export const deleteLinkController = catchAsync(async (req: Request, res: Response) => {
  const  linkId  = req.params.linkId as string;
  const userId = req.user!.userId; 

  await deleteLink(linkId, userId);

  res.status(204).send();
});

export const redirectLinkController = catchAsync(async (req: Request, res: Response) => {
    const shortCode  = req.params.shortCode as string;
    const link = await getLinkByShortCode(shortCode);

    if (!link || link.deletedAt === null) {
         res.status(404).json({ message: "Link not found" });
         return;
    }

    res.redirect(301,link.originalUrl);
});

export const getUserLinksController = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const links = await getUserLinks(userId);
    res.status(200).json(links);
});