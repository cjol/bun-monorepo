import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { uuidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

export const matterSchema = sqliteTable("matter", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  clientName: text("client_name").notNull(),
  matterName: text("matter_name").notNull(),
  description: text("description"),
  ...timestamps,
});

export type Matter = typeof matterSchema.$inferSelect;
export type NewMatter = typeof matterSchema.$inferInsert;

/**
 * Zod validation schemas for Matter entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newMatterInputSchema = z.object({
  clientName: z.string().describe("Name of the client"),
  matterName: z.string().describe("Name of the matter"),
  description: z
    .string()
    .nullable()
    .describe("Optional description of the matter"),
});

export const updateMatterInputSchema = newMatterInputSchema.partial().extend({
  id: uuidSchema.describe("The ULID of the matter to update"),
});
