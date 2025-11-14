import {
  aiSuggestionSchema,
  type AiSuggestionRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
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
  async listAll() {
    const results = await db.query.aiSuggestionSchema.findMany();
    return results;
  },
  async listByTimeEntry(timeEntryId: string) {
    const results = await db.query.aiSuggestionSchema.findMany({
      where: eq(aiSuggestionSchema.timeEntryId, timeEntryId),
    });
    return results;
  },
  async listByStatus(status: "pending" | "approved" | "rejected") {
    const results = await db.query.aiSuggestionSchema.findMany({
      where: eq(aiSuggestionSchema.status, status),
    });
    return results;
  },
});
