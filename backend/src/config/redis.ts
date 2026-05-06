import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    retryStrategy(times){
        if(times > 5) {
            console.error("Failed to connect to Redis after 5 attempts. Giving up.");
            return null;
        }
        const delay = Math.min(times * 200, 2000);
        console.log(`Redis connection failed. Retrying in ${delay}ms... (Attempt ${times})`);
        return delay;
    },
});
redis.on("connect", () => console.log("Redis: connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));