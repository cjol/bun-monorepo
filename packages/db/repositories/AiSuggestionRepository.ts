import {
  aiSuggestionSchema,
  timeEntrySchema,
  type AiSuggestionRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq, and } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleAiSuggestionRepository = ({
  db,
}: Deps): AiSuggestionRepository => ({
  async get(id: string) {
    const result = await db.query.aiSuggestionSchema.findFirst({
      where: eq(aiSuggestionSchema.id, id),
    });
    return result ?? null;
  },
  async create(data) {
    const [result] = await db
      .insert(aiSuggestionSchema)
      .values(data)
      .returning();
    if (!result) throw badImplementation("Failed to create AiSuggestion");
    return result;
  },
  async updateStatus(id: string, status: "pending" | "approved" | "rejected") {
    const [result] = await db
      .update(aiSuggestionSchema)
      .set({ status })
      .where(eq(aiSuggestionSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`AiSuggestion with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(aiSuggestionSchema)
      .where(eq(aiSuggestionSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`AiSuggestion with ID ${id} not found`, { id });
    }
  },
  async listByMatter(matterId: string) {
    const results = await db
      .select()
      .from(aiSuggestionSchema)
      .innerJoin(
        timeEntrySchema,
        eq(aiSuggestionSchema.timeEntryId, timeEntrySchema.id)
      )
      .where(eq(timeEntrySchema.matterId, matterId));
    return results.map((r) => r.ai_suggestion);
  },
  async listByTimeEntry(timeEntryId: string) {
    const results = await db.query.aiSuggestionSchema.findMany({
      where: eq(aiSuggestionSchema.timeEntryId, timeEntryId),
    });
    return results;
  },
  async listByMatterAndStatus(
    matterId: string,
    status: "pending" | "approved" | "rejected"
  ) {
    const results = await db
      .select()
      .from(aiSuggestionSchema)
      .innerJoin(
        timeEntrySchema,
        eq(aiSuggestionSchema.timeEntryId, timeEntrySchema.id)
      )
      .where(
        and(
          eq(timeEntrySchema.matterId, matterId),
          eq(aiSuggestionSchema.status, status)
        )
      );
    return results.map((r) => r.ai_suggestion);
  },
});
