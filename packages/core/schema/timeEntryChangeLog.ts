import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timeEntrySchema } from "./timeEntry";
import type { TimeEntry } from "./timeEntry";

export const timeEntryChangeLogSchema = sqliteTable("time_entry_change_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  timeEntryId: text("time_entry_id")
    .notNull()
    .references(() => timeEntrySchema.id, { onDelete: "cascade" }),
  beforeData: text("before_data", { mode: "json" }).$type<TimeEntry>(),
  afterData: text("after_data", { mode: "json" }).notNull().$type<TimeEntry>(),
  changedAt: integer("changed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type TimeEntryChangeLog = typeof timeEntryChangeLogSchema.$inferSelect;
export type NewTimeEntryChangeLog =
  typeof timeEntryChangeLogSchema.$inferInsert;
