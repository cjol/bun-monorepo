import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { uuidSchema, emailSchema } from "./utils/validation";
import { matterSchema } from "./matter";
import { roleSchema } from "./role";

export const timekeeperSchema = sqliteTable("timekeeper", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roleSchema.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  ...timestamps,
});

export type Timekeeper = typeof timekeeperSchema.$inferSelect;
export type NewTimekeeper = typeof timekeeperSchema.$inferInsert;

/**
 * Zod validation schemas for Timekeeper entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newTimekeeperInputSchema = z.object({
  matterId: uuidSchema.describe("The UUID of the matter"),
  roleId: uuidSchema.describe("The UUID of the role"),
  name: z.string().describe("Name of the timekeeper"),
  email: emailSchema.describe("Email address of the timekeeper"),
});

export const updateTimekeeperInputSchema = newTimekeeperInputSchema
  .partial()
  .extend({
    id: uuidSchema.describe("The UUID of the timekeeper to update"),
  });
