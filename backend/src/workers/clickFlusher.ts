import { it } from "node:test";
import prisma from "../config/prisma";
import {redis} from "../config/redis";

const FLUSH_INTERVAL = 5000; 
const MAX_BATCH_SIZE = 1000;
let flushing = false;

async function flushClicks() {
    if(flushing) return;
    flushing = true;
    try {
        const items = await redis.lpop("click-buffer", MAX_BATCH_SIZE );
        if(!items || items.length === 0) return;

        const clicks = items.map((item) => JSON.parse(item));

        await prisma.click.createMany({data: clicks});
        console.log(`Flushed ${clicks.length} clicks to the database.`);
    } catch(err){
        console.error("Error flushing clicks:", err);
    } finally {
        flushing = false;
    }
}

export const startClickFlusher = () => {
    const interval = setInterval(flushClicks, FLUSH_INTERVAL);
    return interval;

}

export const stopClickFlusher = async (interval: NodeJS.Timeout) => {
    clearInterval(interval);
    await flushClicks(); // Ensure any remaining clicks are flushed before stopping
}