import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { timeEntrySchema } from "./timeEntry";
import { messageSchema } from "./message";

export const aiSuggestionSchema = sqliteTable("ai_suggestion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  timeEntryId: text("time_entry_id")
    .notNull()
    .references(() => timeEntrySchema.id, { onDelete: "cascade" }),
  messageId: text("message_id")
    .notNull()
    .references(() => messageSchema.id, { onDelete: "cascade" }),
  suggestedChanges: text("suggested_changes", { mode: "json" })
    .notNull()
    .$type<Record<string, unknown>>(),
  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .$default(() => "pending"),
  ...timestamps,
});

export type AiSuggestion = typeof aiSuggestionSchema.$inferSelect;
export type NewAiSuggestion = typeof aiSuggestionSchema.$inferInsert;
