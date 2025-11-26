import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { uuidSchema, isoDateSchema } from "./utils/validation";
import { matterSchema } from "./matter";

export const billSchema = sqliteTable("bill", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: ["draft", "finalized", "sent", "paid"],
  })
    .notNull()
    .$default(() => "draft"),
  ...timestamps,
});

export type Bill = typeof billSchema.$inferSelect;
export type NewBill = typeof billSchema.$inferInsert;

/**
 * Zod validation schemas for Bill entity.
 * Used for API input validation and sandbox function parameters.
 */

export const billStatusSchema = z.enum(["draft", "finalized", "sent", "paid"]);

export const newBillInputSchema = z.object({
  matterId: uuidSchema.describe("The UUID of the matter"),
  periodStart: isoDateSchema.describe("Period start date"),
  periodEnd: isoDateSchema.describe("Period end date"),
  status: billStatusSchema.describe("Status of the bill"),
});
