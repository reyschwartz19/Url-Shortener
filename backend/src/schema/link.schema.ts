
import { z } from "zod";

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Must be a valid URL")
    .refine(url => url.startsWith("http://") || url.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),
});


const BLOCKED_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

export const isSafeUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return !BLOCKED_PATTERNS.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
};