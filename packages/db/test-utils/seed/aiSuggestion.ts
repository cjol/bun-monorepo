import { aiSuggestionSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockAiSuggestions = [
  {
    id: "00000000-0000-4000-8000-000000000301",
    timeEntryId: "00000000-0000-4000-8000-000000000201",
    messageId: "00000000-0000-4000-8000-000000000011",
    suggestedChanges: { description: "Updated: Client meeting and follow-up" },
    status: "pending" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000302",
    timeEntryId: "00000000-0000-4000-8000-000000000202",
    messageId: "00000000-0000-4000-8000-000000000012",
    suggestedChanges: { hours: 3.5 },
    status: "approved" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedAiSuggestions = (db: DB) => {
  return db.insert(aiSuggestionSchema).values([...mockAiSuggestions]);
};
