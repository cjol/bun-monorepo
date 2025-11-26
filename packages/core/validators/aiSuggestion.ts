import { z } from "zod";

export const aiSuggestionStatusValidator = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const aiSuggestionValidator = z.object({
  id: z.uuid(),
  timeEntryId: z.uuid(),
  suggestedChanges: z.record(z.string(), z.unknown()),
  status: aiSuggestionStatusValidator,
  createdAt: z.date(),
  updatedAt: z.date(),
});
