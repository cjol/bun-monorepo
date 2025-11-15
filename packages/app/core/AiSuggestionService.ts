import {
  type AiSuggestionRepository,
  type TimeEntryRepository,
  type TimeEntryChangeLogRepository,
  type AiSuggestion,
  type NewAiSuggestion,
  type NewTimeEntryChangeLog,
  aiSuggestionValidator,
} from "@ai-starter/core";
import { notFound, badRequest } from "@hapi/boom";

export interface Deps {
  repos: {
    aiSuggestion: AiSuggestionRepository;
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
  };
}

const serializeTimeEntry = (
  entry: Awaited<ReturnType<TimeEntryRepository["get"]>>
): Record<string, unknown> => {
  if (!entry) throw new Error("TimeEntry not found");
  return {
    id: entry.id,
    matterId: entry.matterId,
    billId: entry.billId,
    date: entry.date.toISOString(),
    hours: entry.hours,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
};

export const AiSuggestionService = (deps: Deps) => {
  const { repos } = deps;

  return {
    createSuggestion: async (data: {
      timeEntryId: string;
      messageId: string;
      suggestedChanges: Record<string, unknown>;
    }): Promise<AiSuggestion> => {
      const newSuggestion: NewAiSuggestion = {
        id: crypto.randomUUID(),
        timeEntryId: data.timeEntryId,
        messageId: data.messageId,
        suggestedChanges: data.suggestedChanges,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      aiSuggestionValidator.parse(newSuggestion);
      return repos.aiSuggestion.create(newSuggestion);
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
      const updated = await repos.timeEntry.update(suggestion.timeEntryId, {
        ...suggestion.suggestedChanges,
        updatedAt: new Date(),
      });

      // Log the update
      const changeLog: NewTimeEntryChangeLog = {
        id: crypto.randomUUID(),
        timeEntryId: updated.id,
        beforeData: serializeTimeEntry(existing),
        afterData: serializeTimeEntry(updated),
        changedAt: new Date(),
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
