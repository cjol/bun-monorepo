import { messageSchema, type Message } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";
import { mockConversations } from "./conversation";

export const mockMessages = [
  {
    id: "00000000-0000-4000-8000-000000000011",
    conversationId: mockConversations[0].id,
    role: "user" as const,
    content: [{ type: "text", text: "Hello, how are you?" }],
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    conversationId: mockConversations[0].id,
    role: "assistant" as const,
    content: [{ type: "text", text: "I'm doing well, thank you!" }],
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000013",
    conversationId: mockConversations[0].id,
    role: "assistant" as const,
    content: [
      {
        type: "tool-call" as const,
        toolCallId: "call-2",
        toolName: "getWeather",
        input: { location: "New York" },
      },
    ],
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000014",
    conversationId: mockConversations[0].id,
    role: "tool" as const,
    content: [
      {
        type: "tool-result" as const,
        toolCallId: "call-2",
        toolName: "getWeather",
        output: { type: "text" as const, value: "72°F and sunny" },
      },
    ],
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const satisfies Message[];

export const doSeedMessages = (db: DB) => {
  return db.insert(messageSchema).values([...mockMessages]);
};
