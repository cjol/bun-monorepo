import { describe, it, expect } from "bun:test";
import type {
  ConversationRepository,
  MessageRepository,
  MessageContent,
} from "@ai-starter/core";
import { EmailIngestionService } from "./EmailIngestionService";

describe("EmailIngestionService", () => {
  const mockConversationRepo: ConversationRepository = {
    list: async () => [],
    get: async () => null,
    getByThreadId: async () => null,
    create: async (data) => ({
      ...data,
      id: data.id ?? "conv-123",
      title: data.title ?? null,
      threadId: data.threadId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: async () => {
      // Mock implementation
    },
  };

  const mockMessageRepo: MessageRepository = {
    listByConversation: async () => [],
    create: async (data) => ({
      ...data,
      id: "msg-123",
      content: data.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  describe("ingestEmail", () => {
    it("should create a new conversation and message for a new email thread", async () => {
      const conversationRepo: ConversationRepository = {
        ...mockConversationRepo,
        list: async () => [],
      };
      const messageRepo: MessageRepository = {
        ...mockMessageRepo,
      };

      const service = EmailIngestionService({
        repos: { conversation: conversationRepo, message: messageRepo },
      });

      const result = await service.ingestEmail({
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Email",
        body: "This is a test email body",
        threadId: "thread-123",
        messageId: "msg-abc",
        receivedAt: new Date("2025-01-01T10:00:00Z"),
      });

      expect(result.conversation).toBeDefined();
      expect(result.conversation.title).toBe("Test Email");
      expect(result.message).toBeDefined();
      expect(result.message.role).toBe("user");
      expect(result.message.content).toEqual([
        {
          type: "text",
          text: "This is a test email body",
        },
      ]);
    });

    it("should find existing conversation by thread ID and add message", async () => {
      const existingConversation = {
        id: "existing-conv-id",
        title: "Existing Thread",
        threadId: "thread-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conversationRepo: ConversationRepository = {
        ...mockConversationRepo,
        getByThreadId: async (threadId: string) =>
          threadId === "thread-123" ? existingConversation : null,
      };

      const messages: {
        id: string;
        conversationId: string;
        role: "user" | "assistant" | "tool";
        content: MessageContent;
        createdAt: Date;
        updatedAt: Date;
      }[] = [];

      const messageRepo: MessageRepository = {
        listByConversation: async () => [],
        create: async (data) => {
          const msg = {
            ...data,
            id: `msg-${messages.length}`,
            content: data.content,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          messages.push(msg);
          return msg;
        },
      };

      const service = EmailIngestionService({
        repos: { conversation: conversationRepo, message: messageRepo },
      });

      const result = await service.ingestEmail({
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Re: Existing Thread",
        body: "This is a reply",
        threadId: "thread-123",
        messageId: "msg-reply",
        receivedAt: new Date("2025-01-01T11:00:00Z"),
      });

      expect(result.conversation.id).toBe("existing-conv-id");
      expect(messages.length).toBe(1);
      expect(messages[0]?.conversationId).toBe("existing-conv-id");
    });

    it("should handle emails without subject", async () => {
      const service = EmailIngestionService({
        repos: {
          conversation: mockConversationRepo,
          message: mockMessageRepo,
        },
      });

      const result = await service.ingestEmail({
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "",
        body: "Email without subject",
        threadId: "thread-no-subject",
        messageId: "msg-no-subject",
        receivedAt: new Date("2025-01-01T10:00:00Z"),
      });

      expect(result.conversation.title).toBe("(No Subject)");
    });

    it("should include email metadata in message content", async () => {
      let createdMessage: {
        content: MessageContent;
      } | null = null;

      const messageRepo: MessageRepository = {
        ...mockMessageRepo,
        create: async (data) => {
          createdMessage = {
            content: data.content,
          };
          return {
            ...data,
            id: "msg-123",
            content: data.content,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      };

      const service = EmailIngestionService({
        repos: {
          conversation: mockConversationRepo,
          message: messageRepo,
        },
      });

      await service.ingestEmail({
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test",
        body: "Body content",
        threadId: "thread-123",
        messageId: "msg-123",
        receivedAt: new Date("2025-01-01T10:00:00Z"),
      });

      expect(createdMessage).not.toBeNull();

      expect(createdMessage!.content).toEqual([
        {
          type: "text",
          text: "Body content",
        },
      ]);
    });

    it("should validate required email fields", async () => {
      const service = EmailIngestionService({
        repos: {
          conversation: mockConversationRepo,
          message: mockMessageRepo,
        },
      });

      // Missing from field
      await expect(
        service.ingestEmail({
          from: "",
          to: "recipient@example.com",
          subject: "Test",
          body: "Body",
          threadId: "thread-123",
          messageId: "msg-123",
          receivedAt: new Date(),
        })
      ).rejects.toThrow();
    });

    it("should handle multiple recipients in to field", async () => {
      const service = EmailIngestionService({
        repos: {
          conversation: mockConversationRepo,
          message: mockMessageRepo,
        },
      });

      const result = await service.ingestEmail({
        from: "sender@example.com",
        to: "recipient1@example.com, recipient2@example.com",
        subject: "Multiple Recipients",
        body: "Test body",
        threadId: "thread-multi",
        messageId: "msg-multi",
        receivedAt: new Date("2025-01-01T10:00:00Z"),
      });

      expect(result.conversation).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it("should use thread ID to match conversations", async () => {
      let getByThreadIdCallCount = 0;
      const conversationRepo: ConversationRepository = {
        ...mockConversationRepo,
        getByThreadId: async (_threadId: string) => {
          getByThreadIdCallCount++;
          return null; // No existing conversation
        },
      };

      const service = EmailIngestionService({
        repos: {
          conversation: conversationRepo,
          message: mockMessageRepo,
        },
      });

      await service.ingestEmail({
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test",
        body: "Body",
        threadId: "thread-456",
        messageId: "msg-456",
        receivedAt: new Date(),
      });

      // Should call getByThreadId to search for existing conversation
      expect(getByThreadIdCallCount).toBeGreaterThan(0);
    });
  });
});
