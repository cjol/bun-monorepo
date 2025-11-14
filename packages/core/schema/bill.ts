import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
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
