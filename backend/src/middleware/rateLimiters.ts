import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import RedisStore, {RedisReply} from 'rate-limit-redis';
import { redis } from "../config/redis";


const isLoadTest = process.env.LOAD_TEST === "true";

type RateLimitRequest = Request & {
    user?: {
        id?: string
    }
}

const createLimiter = (options: {
    windowMs: number
    max: number
    keyPrefix: string
    keyGenerator?: (req: RateLimitRequest) => string
    message: string
}) => {
    return rateLimit ({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: options.keyGenerator ?? ((req) => ipKeyGenerator(req.ip ?? '')),
        store: new RedisStore({
            prefix: `rate-limit:${options.keyPrefix}`,
            sendCommand: (...args: string[]) => 
                redis.call(args[0], ...args.slice(1)) as Promise<RedisReply>,
        }),
    })
}

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'auth',
  message: 'Too many requests from this IP, please try again after 15 minutes.',
})

export const refreshLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: 'refresh',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
})

export const createLinkLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 30,
    keyPrefix: 'create-link',
    keyGenerator: (req) => req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? '')}`,
    message: 'Link creation limit exceeded. Please try again after 1 hour.',
})

export const redirectIpLimiter = isLoadTest
  ? (req: Request, res: Response, next: NextFunction) => next()
  : createLimiter({ windowMs: 60 * 1000, max: 60, keyPrefix: "redirect-ip", message: "Slow down" });

export const redirectCodeLimiter = isLoadTest
  ? (req: Request, res: Response, next: NextFunction) => next()
  : createLimiter({
  windowMs: 60 * 1000,
  max: 200, // per specific short code — catches hotlink abuse
  keyPrefix: 'redirect-code',
  keyGenerator: (req) => {
    const code = req.params.code
    if (typeof code === 'string') return code
    return Array.isArray(code) ? code[0] ?? '' : ''
  },
  message: 'This link is receiving too many requests',
})

