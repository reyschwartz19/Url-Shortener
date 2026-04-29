import prisma from "../config/prisma";
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from "../errors/AppError";
import { CreateLinkInput } from "../types/link.types";
import { nanoid } from "nanoid";

export const createShortLink = async (
    input: CreateLinkInput,
    userId: string
) => {
    const { originalUrl } = input;

    if (!originalUrl) {
        throw new ValidationError("Original URL is required");
    }

    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const shortCode = nanoid(8);

        try {
            return await prisma.link.create({
                data: {
                    originalUrl,
                    shortCode,
                    userId,
                },
            });
        } catch (error: any) {
            if (error.code !== "P2002") {
                throw error;
            }
        }
    }

    throw new ConflictError("Failed to generate unique short link");
};

export const getLinkByShortCode = async (shortCode: string) => {
    return await prisma.link.findUnique({
        where: { shortCode },
    });
};

export const deleteLink= async (linkId: string, userId: string) => {
    const link = await prisma.link.findUnique({
        where: { linkId },
    });

    if(!link || link.deletedAt === null){
        throw new NotFoundError("Link not found");
    }

    if (link.userId !== userId){
        throw new UnauthorizedError("You do not have permission to delete this link");
    }

    await prisma.link.update({
        where: { linkId },
        data: { deletedAt: new Date() },
    });
}

export const getUserLinks = async (userId: string) => {
    return await prisma.link.findMany({
        where: {
            userId,
            deletedAt: null,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}


