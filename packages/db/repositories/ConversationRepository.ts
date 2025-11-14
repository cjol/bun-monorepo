import {
  conversationSchema,
  type ConversationRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleConversationRepository = ({
  db,
}: Deps): ConversationRepository => ({
  async list() {
    const results = await db.query.conversationSchema.findMany({
      orderBy: (conversation, { desc }) => [desc(conversation.createdAt)],
    });
    return results;
  },

  async get(id: string) {
    const result = await db.query.conversationSchema.findFirst({
      where: eq(conversationSchema.id, id),
    });
    return result ?? null;
  },

  async getByThreadId(threadId: string) {
    const result = await db.query.conversationSchema.findFirst({
      where: eq(conversationSchema.threadId, threadId),
    });
    return result ?? null;
  },

  async create(data) {
    const [result] = await db
      .insert(conversationSchema)
      .values(data)
      .returning();
    if (!result) throw badImplementation("Failed to create Conversation");
    return result;
  },

  async delete(id: string) {
    await db.delete(conversationSchema).where(eq(conversationSchema.id, id));
  },
});
