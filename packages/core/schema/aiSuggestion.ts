import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { jsonNewTimeEntry, timeEntrySchema } from "./timeEntry";

export const aiSuggestionSchema = sqliteTable("ai_suggestion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  timeEntryId: text("time_entry_id")
    .notNull()
    .references(() => timeEntrySchema.id, { onDelete: "cascade" }),
  suggestedChanges: jsonNewTimeEntry("suggested_changes").notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .$default(() => "pending"),
  ...timestamps,
});

export type AiSuggestion = typeof aiSuggestionSchema.$inferSelect;
export type NewAiSuggestion = typeof aiSuggestionSchema.$inferInsert;
