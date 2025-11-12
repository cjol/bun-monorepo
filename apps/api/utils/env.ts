import { z } from "zod";
import path from "node:path";

export const env = z
  .object({
    PORT: z
      .string()
      .default("4000")
      .transform((val) => parseInt(val, 10)),
    DATABASE_URL: z
      .string()
      .min(1)
      .default(`file:${path.join(__dirname, "../../../data/sqlite.db")}`),
  })
  .parse(process.env);
