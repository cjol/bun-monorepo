import { conversationSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockConversations = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "First Conversation",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: null,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedConversations = (db: DB) => {
  return db.insert(conversationSchema).values([...mockConversations]);
};
