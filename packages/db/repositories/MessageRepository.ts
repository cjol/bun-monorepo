import { messageSchema, type MessageRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleMessageRepository = ({ db }: Deps): MessageRepository => ({
  async listByConversation(conversationId: string) {
    const results = await db.query.messageSchema.findMany({
      where: eq(messageSchema.conversationId, conversationId),
      orderBy: (message, { asc }) => [asc(message.createdAt)],
    });
    return results;
  },

  async create(data) {
    const [result] = await db.insert(messageSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Message");
    return result;
  },
});
