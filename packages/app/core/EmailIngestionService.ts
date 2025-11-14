import type {
  ConversationRepository,
  MessageRepository,
  Conversation,
  Message,
  MessageContent,
} from "@ai-starter/core";
import { z } from "zod";

export interface Deps {
  repos: {
    conversation: ConversationRepository;
    message: MessageRepository;
  };
}

const emailValidator = z.object({
  from: z.string().email().min(1),
  to: z.string().min(1),
  subject: z.string(),
  body: z.string(),
  threadId: z.string().min(1),
  messageId: z.string().min(1),
  receivedAt: z.date(),
});

export type IngestEmailInput = z.infer<typeof emailValidator>;

export interface IngestEmailResult {
  conversation: Conversation;
  message: Message;
}

export const EmailIngestionService = (deps: Deps) => {
  const { repos } = deps;

  return {
    ingestEmail: async (
      input: IngestEmailInput
    ): Promise<IngestEmailResult> => {
      // Validate input
      emailValidator.parse(input);

      // Find or create conversation based on thread ID
      let conversation = await repos.conversation.getByThreadId(input.threadId);

      if (!conversation) {
        // Create new conversation with subject as title and threadId
        const title = input.subject.trim() || "(No Subject)";
        conversation = await repos.conversation.create({
          title,
          threadId: input.threadId,
          createdAt: input.receivedAt,
          updatedAt: input.receivedAt,
        });
      }

      // Create message with email content
      const messageContent: MessageContent = [
        {
          type: "text",
          text: input.body,
        },
      ];

      const message = await repos.message.create({
        conversationId: conversation.id,
        role: "user",
        content: messageContent,
        createdAt: input.receivedAt,
        updatedAt: input.receivedAt,
      });

      return {
        conversation,
        message,
      };
    },
  };
};

export type EmailIngestionService = ReturnType<typeof EmailIngestionService>;
