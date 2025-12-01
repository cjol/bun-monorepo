import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { jsonTimeEntry, timeEntrySchema } from "./timeEntry";
import { generateId } from "./utils/generateId";

export const timeEntryChangeLogSchema = sqliteTable("time_entry_change_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  timeEntryId: text("time_entry_id")
    .notNull()
    .references(() => timeEntrySchema.id, { onDelete: "cascade" }),
  beforeData: jsonTimeEntry("before_data"),
  afterData: jsonTimeEntry("after_data").notNull(),
  changedAt: integer("changed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type TimeEntryChangeLog = typeof timeEntryChangeLogSchema.$inferSelect;
export type NewTimeEntryChangeLog =
  typeof timeEntryChangeLogSchema.$inferInsert;
