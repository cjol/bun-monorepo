import { describe, test, expect, beforeEach } from "bun:test";
import { AiAgentService } from "./AiAgentService";
import { CoreAppService } from "../core/CoreAppService";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import type { Message } from "@ai-starter/core";

describe("AiAgentService.sendMessage - stream execution test", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof AiAgentService>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repos = getRepos(db);
    const coreService = CoreAppService({ repos });
    service = AiAgentService({ repos, coreService });
  });

  test(
    "should not execute the agent stream twice",
    async () => {
      // Create a conversation
      const conversation = await service.createConversation("Test");
      const conversationId = conversation.id;

      // Track what comes through the stream
      const streamedTextDeltas: string[] = [];
      const streamedMessages: Message[] = [];

      const { stream, messages: promisedMessages } = await service.sendMessage(
        conversationId,
        "What's the weather in London?"
      );

      // Consume the stream
      for await (const chunk of stream) {
        if (chunk.type === "text-delta") {
          streamedTextDeltas.push(chunk.delta);
        } else if (chunk.type === "message") {
          streamedMessages.push(chunk.message);
        }
      }

      const promiseMessages = await promisedMessages;

      // Get all persisted messages AFTER the promise
      const persistedAfterPromise =
        await repos.message.listByConversation(conversationId);

      // Count user messages - there should only be ONE
      const userMessages = persistedAfterPromise.filter(
        (m) => m.role === "user"
      );

      expect(userMessages.length).toBe(1);
      const persistedWithoutUser = persistedAfterPromise.slice(1);
      // streamed, promised, and persisted messages should all match
      expect(persistedWithoutUser).toEqual(promiseMessages);
      expect(promiseMessages).toEqual(streamedMessages);
    },
    // TODO: mock the llm to make this test faster
    { timeout: 10000 }
  );
});
