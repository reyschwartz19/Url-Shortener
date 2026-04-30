import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import geoip from "geoip-lite";
import { Request } from "express";

export const recordClick = async(linkId: string, req: Request) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? null;
    const geo = ip ? geoip.lookup(ip) : null;
    const country = geo?.country ?? null

    const ipHash = ip ? await bcrypt.hash(ip,5): null
    await prisma.click.create({
        data: {
            linkId,
            country,
            ipHash
        }
    })
}

export const getTotalClicks = async (linkId: string) => {
    const count = await prisma.click.count({
        where: {linkId}
    });
    
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