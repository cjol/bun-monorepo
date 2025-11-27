import { evalite } from "evalite";
import { wrapAISDKModel } from "evalite/ai-sdk";
import { AiAgentService } from "./AiAgentService";
import { CoreAppService } from "../core/CoreAppService";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos } from "@ai-starter/db";
import type { Message } from "@ai-starter/core";
import { Experimental_Agent as Agent } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Shared setup function to create database, repos, and service for each test
 * Creates a simple test agent instead of the full data analysis agent
 */
async function setupTest() {
  const db = await testDB({ seed: false });
  const repos = getRepos(db);
  const coreService = CoreAppService({ repos });

  // Create a simple agent for testing with wrapped model
  const agent = new Agent({
    model: wrapAISDKModel(anthropic("claude-haiku-4-5")),
    system: "You are a helpful assistant.",
  });

  const service = AiAgentService({
    repos,
    coreService,
    agent,
  });
  return { db, repos, service };
}

evalite("AiAgentService - Stream Execution (No Double Execution)", {
  data: [
    {
      input: {
        conversationName: "Test",
        message: "What's the weather in London?",
      },
      expected: {
        userMessageCount: 1,
      },
    },
  ],
  task: async (input) => {
    const { service } = await setupTest();

    // Create a conversation
    const conversation = await service.createConversation(
      input.conversationName
    );
    const conversationId = conversation.id;

    // Track what comes through the stream
    const streamedTextDeltas: string[] = [];
    const streamedMessages: Message[] = [];

    const { stream, messages: promisedMessages } = await service.sendMessage(
      conversationId,
      input.message
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
      await service.getConversationMessages(conversationId);

    // Count user messages - there should only be ONE
    const userMessages = persistedAfterPromise.filter((m) => m.role === "user");

    return {
      userMessageCount: userMessages.length,
      persistedMessagesWithoutUser: persistedAfterPromise.slice(1),
      promiseMessages,
      streamedMessages,
    };
  },
  scorers: [
    {
      name: "Only One User Message",
      scorer: ({ output, expected }) => {
        return output.userMessageCount === expected.userMessageCount ? 1 : 0;
      },
    },
    {
      name: "Persisted Matches Promised",
      scorer: ({ output }) => {
        return JSON.stringify(output.persistedMessagesWithoutUser) ===
          JSON.stringify(output.promiseMessages)
          ? 1
          : 0;
      },
    },
    {
      name: "Promised Matches Streamed",
      scorer: ({ output }) => {
        return JSON.stringify(output.promiseMessages) ===
          JSON.stringify(output.streamedMessages)
          ? 1
          : 0;
      },
    },
  ],
});
