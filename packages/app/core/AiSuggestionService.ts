import {
  type AiSuggestionRepository,
  type TimeEntryRepository,
  type TimeEntryChangeLogRepository,
  type AiSuggestion,
  type NewTimeEntryChangeLog,
  type NewTimeEntry,
} from "@ai-starter/core";
import { notFound, badRequest } from "@hapi/boom";

export interface Deps {
  repos: {
    aiSuggestion: AiSuggestionRepository;
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
  };
}

export const AiSuggestionService = (deps: Deps) => {
  const { repos } = deps;

  return {
    createSuggestion: async (data: {
      timeEntryId: string;
      suggestedChanges: NewTimeEntry;
    }): Promise<AiSuggestion> => {
      return repos.aiSuggestion.create({
        timeEntryId: data.timeEntryId,
        suggestedChanges: data.suggestedChanges,
        status: "pending",
      });
    },

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

      // Get the current time entry for change log
      const existing = await repos.timeEntry.get(suggestion.timeEntryId);
      if (!existing) {
        throw notFound(`TimeEntry with id ${suggestion.timeEntryId} not found`);
      }

      // Apply the suggested changes to the time entry
      const updated = await repos.timeEntry.update(
        suggestion.timeEntryId,
        suggestion.suggestedChanges
      );

      // Log the update
      const changeLog: NewTimeEntryChangeLog = {
        timeEntryId: updated.id,
        beforeData: existing,
        afterData: updated,
      };
      await repos.timeEntryChangeLog.insert(changeLog);

      // Update suggestion status
      return repos.aiSuggestion.updateStatus(id, "approved");
    },

    rejectSuggestion: async (id: string): Promise<AiSuggestion> => {
      const suggestion = await repos.aiSuggestion.get(id);
      if (!suggestion) {
        throw notFound(`AI suggestion with id ${id} not found`);
      }

      return repos.aiSuggestion.updateStatus(id, "rejected");
    },

    listByTimeEntry: async (timeEntryId: string): Promise<AiSuggestion[]> => {
      return repos.aiSuggestion.listByTimeEntry(timeEntryId);
    },

    listByStatus: async (
      matterId: string,
      status: "pending" | "approved" | "rejected"
    ): Promise<AiSuggestion[]> => {
      return repos.aiSuggestion.listByMatterAndStatus(matterId, status);
    },

    listByMatter: async (matterId: string): Promise<AiSuggestion[]> => {
      return repos.aiSuggestion.listByMatter(matterId);
    },
  };
};

export type AiSuggestionService = ReturnType<typeof AiSuggestionService>;
