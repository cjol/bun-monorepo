import {
  type ConversationRepository,
  type MessageRepository,
  type Conversation,
  type Message,
  type NewConversation,
  type NewMessage,
} from "@ai-starter/core";
import type { CoreAppService } from "../core/CoreAppService";
import { stepCountIs, tool, type ModelMessage } from "ai";

import { Experimental_Agent as Agent } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import z from "zod";
import {
  streamAgent,
  wrapStreamWithPromise,
  type SimplifiedStreamPart,
} from "./utils";

const myAgent = new Agent({
  model: anthropic("claude-haiku-4-5"),
  system:
    "You are a helpful assistant for an extraterrestrial weather service.",
  tools: {
    getWeather: tool({
      description: "Get Weather",
      inputSchema: z.object({
        location: z
          .string()
          .describe("The city and state, e.g. San Francisco, CA"),
      }),
      execute: async () => {
        // Execute code and return result
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { output: Math.floor(Math.random() * 30) + " degrees celsius" };
      },
    }),
  },
  stopWhen: stepCountIs(5),
});

/**
 * These are the dependencies required by the AiAgentService.
 * We inject the *ports* (interfaces), not concrete implementations.
 */
export interface AiAgentServiceDeps {
  repos: {
    conversation: ConversationRepository;
    message: MessageRepository;
  };
  coreService: CoreAppService;
  agent?: typeof myAgent;
}

/**
 * This is the factory function for the AiAgentService.
 *
 * @param deps The dependencies (ports) needed by the service.
 * @returns The AiAgentService.
 */
export const AiAgentService = (deps: AiAgentServiceDeps) => {
  const { repos, agent = myAgent } = deps;

  return {
    /**
     * Lists all conversations, ordered by most recent first.
     * @returns Array of all conversations
     */
    listConversations: async (): Promise<Conversation[]> => {
      return repos.conversation.list();
    },

    /**
     * Gets all messages for a specific conversation, ordered chronologically.
     * @param conversationId The UUID of the conversation
     * @returns Array of messages in the conversation
     */
    getConversationMessages: async (
      conversationId: string
    ): Promise<Message[]> => {
      return repos.message.listByConversation(conversationId);
    },

    /**
     * Creates a new conversation.
     * @param title Optional title for the conversation
     * @returns The newly created conversation
     */
    createConversation: async (title?: string): Promise<Conversation> => {
      const newConversation: NewConversation = {
        title: title ?? null,
      };

      return repos.conversation.create(newConversation);
    },

    /**
     * Sends a message to the agent and persists both the user message and agent response.
     * Returns a stream that yields text deltas and complete messages (tool calls/results)
     * as they're generated, and a promise that resolves to all new messages once complete.
     *
     * @param conversationId The UUID of the conversation
     * @param message The user's message content
     * @returns Object containing an async generator for streaming and a promise for all new messages
     */
    sendMessage: async (
      conversationId: string,
      message: string
    ): Promise<{
      stream: AsyncGenerator<SimplifiedStreamPart, void, undefined>;
      messages: Promise<Message[]>;
    }> => {
      // Verify conversation exists
      const conversation = await repos.conversation.get(conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Get existing messages to build context
      const existingMessages: (NewMessage | Message)[] =
        await repos.message.listByConversation(conversationId);

      const userMessage: NewMessage = {
        conversationId,
        role: "user",
        content: [{ type: "text", text: message }],
      };

      // Persist the user message
      await repos.message.create(userMessage);

      // Add the new user message to context
      existingMessages.push(userMessage);

      // Stream agent responses with callback for persistence
      const stream = streamAgent({
        agent,
        conversationId,
        // assertion necessary because our type isn't discriminated by `role`
        messages: existingMessages as ModelMessage[],
        onCompleteMessage: (newMessage: NewMessage) =>
          repos.message.create(newMessage),
      });

      // Wrap the stream to collect messages and provide a promise
      return wrapStreamWithPromise(stream);
    },
  };
};

/**
 * Export the type of the service for use in other layers.
 */
export type AiAgentService = ReturnType<typeof AiAgentService>;
