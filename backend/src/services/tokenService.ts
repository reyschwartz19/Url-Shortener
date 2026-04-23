import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { UnauthorizedError } from "../errors/AppError";
import { ENV } from "../config/env";



const ACCESS_SECRET = ENV.JWT_SECRET;
const REFRESH_SECRET = ENV.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXP= "15m";
const REFRESH_TOKEN_EXP = "7d";

export const signAccessToken = (userId: string) => {
   return jwt.sign({userId}, ACCESS_SECRET, {expiresIn: ACCESS_TOKEN_EXP})
}

export const verifyAccessToken = (token: string) => {
    try {
        return jwt.verify(token, ACCESS_SECRET) as {userId: string}
    } catch {
        throw new UnauthorizedError("Invalid access token");
    }
}

export const signRefreshToken = (userId: string, token: string) => {
    return jwt.sign({userId, token}, REFRESH_SECRET, {expiresIn: REFRESH_TOKEN_EXP})
}

export const saveRefreshToken = async(userId: string, token: string) => {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
        data: {userId, tokenHash, expiresAt}
    })
}

export const rotateRefreshToken = async(userId: string, oldToken: string) => {
    const payload = jwt.decode(oldToken) as {userId: string};
    if (!payload) {
        throw new UnauthorizedError("Invalid refresh token");
    }

    const sessions = await prisma.session.findMany({
        where: {
            userId: payload.userId,
            expiresAt: {
                gt: new Date()
            }
        }
    })

    let matchedSession = null;
    for (const session of sessions) {
        const match = await bcrypt.compare(oldToken, session.tokenHash);
        if(match) {matchedSession = session; break;}
    }

    if (!matchedSession) {
        throw new UnauthorizedError("Refresh token not found");
    }

    try{
        jwt.verify(oldToken, REFRESH_SECRET);
    }catch{
        await prisma.session.delete({
            where: {
                sessionId: matchedSession.sessionId
            }
        })
        throw new UnauthorizedError("Refresh token expired");
    }

    await prisma.session.delete({
        where: {
            sessionId: matchedSession.sessionId
        }
    })

    const newAccessToken = signAccessToken(payload.userId);
    const newRefreshToken = signRefreshToken(payload.userId, newAccessToken);
    await saveRefreshToken(payload.userId, newAccessToken);

    return { accessToken: newAccessToken, refreshAccessToken: newRefreshToken };
}

export const revokeRefreshToken = async (userId: string, token: string) => {
    const sessions = await prisma.session.findMany({
        where: {
            userId
        }
    })

    for (const session of sessions) {
        const match = await bcrypt.compare(token, session.tokenHash);
        if (match) {
            await prisma.session.delete({
                where: {
                    sessionId: session.sessionId
                }
            })
            return;
        }
    }
}