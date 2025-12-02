import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

export const roleSchema = sqliteTable("role", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps,
});

export type Role = typeof roleSchema.$inferSelect;
export type NewRole = typeof roleSchema.$inferInsert;

/**
 * Zod validation schemas for Role entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newRoleInputSchema = z.object({
  name: z.string().describe("Role name (e.g., Associate, Partner)"),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Description of the role"),
});

export const updateRoleInputSchema = newRoleInputSchema.partial().extend({
  id: ulidSchema.describe("The ULID of the role to update"),
});
