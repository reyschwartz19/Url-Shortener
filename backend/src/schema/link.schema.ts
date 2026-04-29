
import { z } from "zod";

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Must be a valid URL")
    .refine(url => url.startsWith("http://") || url.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),
});