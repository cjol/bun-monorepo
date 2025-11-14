import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { matterSchema } from "./matter";
import { billSchema } from "./bill";

export const timeEntrySchema = sqliteTable("time_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  billId: text("bill_id").references(() => billSchema.id, {
    onDelete: "set null",
  }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  hours: real("hours").notNull(),
  description: text("description").notNull(),
  ...timestamps,
});

export type TimeEntry = typeof timeEntrySchema.$inferSelect;
export type NewTimeEntry = typeof timeEntrySchema.$inferInsert;
