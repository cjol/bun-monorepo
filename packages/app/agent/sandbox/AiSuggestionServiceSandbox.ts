import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { AiSuggestionService } from "../../core/AiSuggestionService";
import { newAiSuggestionInputSchema } from "@ai-starter/core/schema/aiSuggestion";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for AiSuggestionService.
 * These functions are used by the general-purpose agent to interact with AI suggestions.
 */
export function createAiSuggestionSandboxFunctions(
  service: AiSuggestionService
) {
  const createAiSuggestion = defineSandboxFunction({
    description:
      "Create an AI suggestion for time entry changes (for review/approval)",
    inputSchema: newAiSuggestionInputSchema,
    execute: async ({ timeEntryId, suggestedChanges, explanation }) => {
      return service.createSuggestion({
        timeEntryId,
        suggestedChanges: {
          ...suggestedChanges,
          date: new Date(suggestedChanges.date),
        },
        explanation,
      });
    },
  });

  const listPendingSuggestions = defineSandboxFunction({
    description: "List all pending AI suggestions for a matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return service.listByStatus(matterId, "pending");
    },
  });

  return {
    createAiSuggestion,
    listPendingSuggestions,
  };
}
