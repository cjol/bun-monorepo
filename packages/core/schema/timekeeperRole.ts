import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema, positiveNumberSchema } from "./utils/validation";
import { timekeeperSchema } from "./timekeeper";
import { matterSchema } from "./matter";
import { roleSchema } from "./role";
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
  roleId: text("role_id")
    .notNull()
    .references(() => roleSchema.id, { onDelete: "cascade" }),
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
  roleId: ulidSchema.describe("The ULID of the role"),
  billableRate: positiveNumberSchema.describe("Hourly billable rate"),
});

export const updateTimekeeperRoleInputSchema = newTimekeeperRoleInputSchema
  .partial()
  .extend({
    id: ulidSchema.describe("The ULID of the timekeeper role to update"),
  });
