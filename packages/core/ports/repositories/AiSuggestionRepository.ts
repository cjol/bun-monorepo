import type { AiSuggestion, NewAiSuggestion } from "../../schema";

export interface AiSuggestionRepository {
  get(id: string): Promise<AiSuggestion | null>;
  listByMatter(matterId: string): Promise<AiSuggestion[]>;
  listByTimeEntry(timeEntryId: string): Promise<AiSuggestion[]>;
  listByMatterAndStatus(
    matterId: string,
    status: "pending" | "approved" | "rejected"
  ): Promise<AiSuggestion[]>;
  create(data: NewAiSuggestion): Promise<AiSuggestion>;
  updateStatus(
    id: string,
    status: "pending" | "approved" | "rejected"
  ): Promise<AiSuggestion>;
  delete(id: string): Promise<void>;
}
