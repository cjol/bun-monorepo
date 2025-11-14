import { describe, it, expect } from "bun:test";
import type { MessageRepository, MessageContent } from "@ai-starter/core";
import { EmailSendingService } from "./EmailSendingService";
import type { EmailProvider, SendEmailParams } from "./EmailSendingService";

describe("EmailSendingService", () => {
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

  const createMockEmailProvider = (
    implementation?: Partial<EmailProvider>
  ): EmailProvider => ({
    send: async () => ({
      messageId: "email-msg-123",
      success: true,
    }),
    ...implementation,
  });

  describe("sendEmail", () => {
    it("should send an email with text content from a message", async () => {
      let sentEmail: {
        to: string;
        from: string;
        subject: string;
        body: string;
      } | null = null;

      const mockProvider = createMockEmailProvider({
        send: async (params: SendEmailParams) => {
          sentEmail = params;
          return {
            messageId: "email-msg-123",
            success: true,
          };
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        {
          type: "text",
          text: "Hello, this is a test email body.",
        },
      ];

      const result = await service.sendEmail({
        messageId: "msg-123",
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        messageContent,
      });

      expect(result.success).toBe(true);
      expect(result.emailMessageId).toBe("email-msg-123");
      expect(sentEmail).not.toBeNull();
      expect(sentEmail!.to).toBe("recipient@example.com");
      expect(sentEmail!.from).toBe("sender@example.com");
      expect(sentEmail!.subject).toBe("Test Subject");
      expect(sentEmail!.body).toBe("Hello, this is a test email body.");
    });

    it("should concatenate multiple text parts into email body", async () => {
      let sentEmail: { body: string } | null = null;

      const mockProvider = createMockEmailProvider({
        send: async (params: SendEmailParams) => {
          sentEmail = { body: params.body };
          return { messageId: "email-msg-123", success: true };
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        { type: "text", text: "First part. " },
        { type: "text", text: "Second part. " },
        { type: "text", text: "Third part." },
      ];

      await service.sendEmail({
        messageId: "msg-123",
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Multi-part Message",
        messageContent,
      });

      expect(sentEmail).not.toBeNull();
      expect(sentEmail!.body).toBe("First part. Second part. Third part.");
    });

    it("should skip non-text content parts", async () => {
      let sentEmail: { body: string } | null = null;

      const mockProvider = createMockEmailProvider({
        send: async (params: SendEmailParams) => {
          sentEmail = { body: params.body };
          return { messageId: "email-msg-123", success: true };
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        { type: "text", text: "Text before tool call. " },
        {
          type: "tool-call",
          toolCallId: "call-123",
          toolName: "someTool",
          input: { foo: "bar" },
        },
        { type: "text", text: "Text after tool call." },
      ];

      await service.sendEmail({
        messageId: "msg-123",
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Mixed Content",
        messageContent,
      });

      expect(sentEmail).not.toBeNull();
      expect(sentEmail!.body).toBe(
        "Text before tool call. Text after tool call."
      );
    });

    it("should validate required fields", async () => {
      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: createMockEmailProvider(),
      });

      const messageContent: MessageContent = [
        { type: "text", text: "Test body" },
      ];

      // Missing 'to' field
      await expect(
        service.sendEmail({
          messageId: "msg-123",
          to: "",
          from: "sender@example.com",
          subject: "Test",
          messageContent,
        })
      ).rejects.toThrow();

      // Missing 'from' field
      await expect(
        service.sendEmail({
          messageId: "msg-123",
          to: "recipient@example.com",
          from: "",
          subject: "Test",
          messageContent,
        })
      ).rejects.toThrow();

      // Invalid from email format
      await expect(
        service.sendEmail({
          messageId: "msg-123",
          to: "recipient@example.com",
          from: "invalid-email",
          subject: "Test",
          messageContent,
        })
      ).rejects.toThrow();
    });

    it("should handle empty message content gracefully", async () => {
      let sentEmail: { body: string } | null = null;

      const mockProvider = createMockEmailProvider({
        send: async (params: SendEmailParams) => {
          sentEmail = { body: params.body };
          return { messageId: "email-msg-123", success: true };
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [];

      await service.sendEmail({
        messageId: "msg-123",
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Empty Message",
        messageContent,
      });

      expect(sentEmail).not.toBeNull();
      expect(sentEmail!.body).toBe("");
    });

    it("should handle provider errors by throwing", async () => {
      const mockProvider = createMockEmailProvider({
        send: async () => {
          throw new Error("Provider connection failed");
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        { type: "text", text: "Test body" },
      ];

      await expect(
        service.sendEmail({
          messageId: "msg-123",
          to: "recipient@example.com",
          from: "sender@example.com",
          subject: "Test",
          messageContent,
        })
      ).rejects.toThrow("Provider connection failed");
    });

    it("should handle multiple recipients", async () => {
      let sentEmail: { to: string } | null = null;

      const mockProvider = createMockEmailProvider({
        send: async (params: SendEmailParams) => {
          sentEmail = { to: params.to };
          return { messageId: "email-msg-123", success: true };
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        { type: "text", text: "Test body" },
      ];

      await service.sendEmail({
        messageId: "msg-123",
        to: "recipient1@example.com, recipient2@example.com",
        from: "sender@example.com",
        subject: "Test",
        messageContent,
      });

      expect(sentEmail).not.toBeNull();
      expect(sentEmail!.to).toBe(
        "recipient1@example.com, recipient2@example.com"
      );
    });

    it("should allow optional subject", async () => {
      let sentEmail: { subject: string } | null = null;

      const mockProvider = createMockEmailProvider({
        send: async (params: SendEmailParams) => {
          sentEmail = { subject: params.subject };
          return { messageId: "email-msg-123", success: true };
        },
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        { type: "text", text: "Test body" },
      ];

      await service.sendEmail({
        messageId: "msg-123",
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "",
        messageContent,
      });

      expect(sentEmail).not.toBeNull();
      expect(sentEmail!.subject).toBe("");
    });

    it("should return provider message ID on success", async () => {
      const mockProvider = createMockEmailProvider({
        send: async () => ({
          messageId: "provider-msg-xyz",
          success: true,
        }),
      });

      const service = EmailSendingService({
        repos: { message: mockMessageRepo },
        emailProvider: mockProvider,
      });

      const messageContent: MessageContent = [
        { type: "text", text: "Test body" },
      ];

      const result = await service.sendEmail({
        messageId: "msg-123",
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        messageContent,
      });

      expect(result.success).toBe(true);
      expect(result.emailMessageId).toBe("provider-msg-xyz");
    });
  });
});
