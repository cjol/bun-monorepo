import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { uuidSchema } from "./utils/validation";
import {
  jsonNewTimeEntry,
  timeEntrySchema,
  newTimeEntryInputSchema,
} from "./timeEntry";

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

/**
 * Zod validation schemas for AiSuggestion entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newAiSuggestionInputSchema = z.object({
  timeEntryId: uuidSchema.describe(
    "The UUID of the time entry to suggest changes for"
  ),
  suggestedChanges: newTimeEntryInputSchema.describe(
    "Object containing the suggested time entry changes"
  ),
});
