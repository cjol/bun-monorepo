import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import {
  jsonNewTimeEntry,
  timeEntrySchema,
  newTimeEntryInputSchema,
} from "./timeEntry";
import { generateId } from "./utils/generateId";

export const aiSuggestionSchema = sqliteTable("ai_suggestion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
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
  timeEntryId: ulidSchema.describe(
    "The ULID of the time entry to suggest changes for"
  ),
  suggestedChanges: newTimeEntryInputSchema.describe(
    "Object containing the suggested time entry changes"
  ),
});
