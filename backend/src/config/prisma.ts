import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

declare global {
    var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = 
    global.prisma ||
    new PrismaClient({
        adapter,
        log: ['error', 'warn']
    });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;