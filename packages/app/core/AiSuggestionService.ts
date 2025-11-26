import {
  type AiSuggestionRepository,
  type AiSuggestion,
} from "@ai-starter/core";
import { notFound, badRequest } from "@hapi/boom";
import type { TimeEntryService } from "./TimeEntryService";

export interface Deps {
  repos: {
    aiSuggestion: AiSuggestionRepository;
  };
  services: {
    timeEntry: TimeEntryService;
  };
}

export const AiSuggestionService = (deps: Deps) => {
  const { repos, services } = deps;

  return {
    createSuggestion: repos.aiSuggestion.create,
    listByTimeEntry: repos.aiSuggestion.listByTimeEntry,
    listByStatus: repos.aiSuggestion.listByMatterAndStatus,
    listByMatter: repos.aiSuggestion.listByMatter,

    approveSuggestion: async (id: string): Promise<AiSuggestion> => {
      const suggestion = await repos.aiSuggestion.get(id);
      if (!suggestion) {
        throw notFound(`AI suggestion with id ${id} not found`);
      }

      if (suggestion.status !== "pending") {
        throw badRequest(
          `Cannot approve suggestion that is already ${suggestion.status}`
        );
      }

      await services.timeEntry.updateTimeEntry(
        suggestion.timeEntryId,
        suggestion.suggestedChanges
      );

      return repos.aiSuggestion.updateStatus(id, "approved");
    },

    rejectSuggestion: async (id: string): Promise<AiSuggestion> => {
      const suggestion = await repos.aiSuggestion.get(id);
      if (!suggestion) {
        throw notFound(`AI suggestion with id ${id} not found`);
      }

      if (suggestion.status !== "pending") {
        throw badRequest(
          `Cannot approve suggestion that is already ${suggestion.status}`
        );
      }

      return repos.aiSuggestion.updateStatus(id, "rejected");
    },
  };
};

export type AiSuggestionService = ReturnType<typeof AiSuggestionService>;
