import prisma from "../config/prisma";
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from "../errors/AppError";
import { isSafeUrl } from "../schema/link.schema";
import { CreateLinkInput } from "../types/link.types";
import { nanoid } from "nanoid";
import { redis } from "../config/redis";

const CACHE_TTL = 60 * 60; 
const cacheKey = (shortCode: string) => `link:${shortCode}`;

type CachedLink = {
    originalUrl: string;
    linkId: string;
    shortCode: string;
    deletedAt: null;
}


export const createShortLink = async (
    input: CreateLinkInput,
    userId: string
) => {
    const { originalUrl } = input;

    if (!originalUrl) {
        throw new ValidationError("Original URL is required");
    }

    if(!isSafeUrl(originalUrl)){
        throw new ValidationError("URL is not allowed");
    }

    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const shortCode = nanoid(8);

        try {
            const link =  await prisma.link.create({
                data: {
                    originalUrl,
                    shortCode,
                    userId,
                },
            });

            await redis.hset(`link:${shortCode}`,{
                originalUrl,
                userId,
                clicks: "0",
                createdAt: link.createdAt.toISOString(),
            });
            return link;
        } catch (error: any) {
            if (error.code !== "P2002") {
                throw error;
            }
        }
    }

    throw new ConflictError("Failed to generate unique short link");
};

export const getLinkByShortCode = async (shortCode: string): Promise<CachedLink | Awaited<ReturnType<typeof prisma.link.findUnique>>> => {
    const cached =  await redis.get(cacheKey(shortCode));
    if (cached) {
        return JSON.parse(cached) as CachedLink;
    }
    const link =  await prisma.link.findUnique({
        where: { shortCode },
    });

    if(link && !link.deletedAt){
        await redis.set(
            cacheKey(shortCode),
            JSON.stringify({originalUrl: link.originalUrl, linkId: link.linkId, shortCode: link.shortCode, deletedAt: link.deletedAt}),
            "EX",
            CACHE_TTL
        );
        
    }
    return link;
};

export const getLinkById = async (linkId: string) => {
    return await prisma.link.findUnique({
        where: { linkId },
    });
}

export const deleteLink= async (linkId: string, userId: string) => {
    const link = await prisma.link.findUnique({
        where: { linkId },
    });

    if(!link || link.deletedAt){
        throw new NotFoundError("Link not found");
    }

    if (link.userId !== userId){
        throw new UnauthorizedError("You do not have permission to delete this link");
    }

    await prisma.link.update({
        where: { linkId },
        data: { deletedAt: new Date() },
    });

    await Promise.all([
    redis.del(cacheKey(link.shortCode)),
    redis.del(`meta:${link.shortCode}`),
  ]);
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


