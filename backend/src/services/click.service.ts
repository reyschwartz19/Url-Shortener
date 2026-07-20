import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import geoip from "geoip-lite";
import { Request } from "express";
import { redis } from "../config/redis";
import crypto from "crypto";

export const recordClick = async(linkId: string, req: Request, shortCode: string) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? null;
    const geo = ip ? geoip.lookup(ip) : null;
    const country = geo?.country ?? null

    const ipHash = ip ?  crypto.createHash("sha256").update(ip).digest("hex"): null
    
//     await Promise.all([
//     prisma.click.create({ data: { linkId, country, ipHash } }),
//     redis.hincrby(`meta:${shortCode}`, "clicks", 1),
//   ]);

    await Promise.all([
        redis.rpush("click-buffer", JSON.stringify({
            linkId,
            country,
            ipHash
        })),
        redis.hincrby(`meta:${shortCode}`, "clicks", 1),
    ])

}

export const getTotalClicks = async (linkId: string, shortCode?: string) => {

    if(shortCode){
        const cached = await redis.hget(`meta:${shortCode}`, "clicks");
        if(cached !== null){
            return { totalCount: parseInt(cached) };
        }
    }

    const count = await prisma.click.count({
        where: {linkId}
    });

     if (shortCode) {
    await redis.hset(`meta:${shortCode}`, "clicks", String(count));
  }
    
    return {totalCount: count}
}

export const getClicksByCountry = async (linkId: string) => {
    const results = await prisma.click.groupBy({
        by: ["country"],
        where: { linkId },
        _count: {
            country: true,
        },
        orderBy: {_count: {country: "desc"}},
    })
    return results.map(r => ({
        country: r.country,
        count: r._count.country
    }))
}

export const getClicksOverTime = async (linkId: string) => {
  const clicks = await prisma.click.findMany({
    where: { linkId },
    select: { clickedAt: true },
    orderBy: { clickedAt: "asc" },
  });

  const grouped = clicks.reduce((acc, click) => {
    const date = click.clickedAt.toISOString().split("T")[0]; 
    acc[date] = (acc[date] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
};