import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema, positiveNumberSchema } from "./utils/validation";
import { timekeeperSchema } from "./timekeeper";
import { matterSchema } from "./matter";
import { generateId } from "./utils/generateId";

export const timekeeperRoleSchema = sqliteTable("timekeeper_role", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  timekeeperId: text("timekeeper_id")
    .notNull()
    .references(() => timekeeperSchema.id, { onDelete: "cascade" }),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  billableRate: real("billable_rate").notNull(),
  ...timestamps,
});

export type TimekeeperRole = typeof timekeeperRoleSchema.$inferSelect;
export type NewTimekeeperRole = typeof timekeeperRoleSchema.$inferInsert;

/**
 * Zod validation schemas for TimekeeperRole entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newTimekeeperRoleInputSchema = z.object({
  timekeeperId: ulidSchema.describe("The ULID of the timekeeper"),
  matterId: ulidSchema.describe("The ULID of the matter"),
  role: z.string().describe("Role title (e.g. Associate, Partner)"),
  billableRate: positiveNumberSchema.describe("Hourly billable rate"),
});

export const updateTimekeeperRoleInputSchema = newTimekeeperRoleInputSchema
  .partial()
  .extend({
    id: ulidSchema.describe("The ULID of the timekeeper role to update"),
  });
