import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleMessageRepository } from "./MessageRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { mockConversations } from "../test-utils";

describe("DrizzleMessageRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleMessageRepository>;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleMessageRepository({ db });
  });

  describe("listByConversation", () => {
    it("should return all messages for a conversation ordered chronologically", async () => {
      const result = await repository.listByConversation(
        mockConversations[0].id
      );

      expect(result).toHaveLength(4);
      expect(result[0]?.role).toBe("user");
      expect(result[0]?.content).toBe("Hello, how are you?");
      expect(result[1]?.role).toBe("assistant");
      expect(result[1]?.content).toBe("I'm doing well, thank you!");
      expect(result[2]?.role).toBe("assistant");
      expect(Array.isArray(result[2]?.content)).toBe(true);
      expect(result[3]?.role).toBe("tool");
      expect(Array.isArray(result[3]?.content)).toBe(true);
    });

    it("should return empty array when conversation has no messages", async () => {
      const result = await repository.listByConversation(
        mockConversations[1].id
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new message", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix
      await repository.create({
        id: "00000000-0000-4000-8000-000000000099",
        conversationId: mockConversations[1].id,
        role: "user",
        content: "New message",
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.listByConversation(
        mockConversations[1].id
      );

      expect(result).toBeArrayOfSize(1);
      expect(result[0]!.id).toBe("00000000-0000-4000-8000-000000000099");
      expect(result[0]!.content).toBe("New message");
      expect(result[0]!.role).toBe("user");
    });

    it("should create a message with tool calls", async () => {
      const now = new Date();
      now.setMilliseconds(0);
      const content = [
        {
          type: "tool-call" as const,
          toolName: "getFoo",
          toolCallId: "call-1",
          args: { id: "foo-1" },
        },
      ];
      await repository.create({
        id: "00000000-0000-4000-8000-000000000098",
        conversationId: mockConversations[1].id,
        role: "assistant",
        content,
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.listByConversation(
        mockConversations[1].id
      );

      expect(result).toBeArrayOfSize(1);
      expect(result[0]!.id).toBe("00000000-0000-4000-8000-000000000098");
      expect(result[0]!.role).toBe("assistant");
      expect(result[0]!.content).toEqual(content);
    });

    it("should auto-generate ID and timestamps for a new message", async () => {
      const message = await repository.create({
        conversationId: mockConversations[1].id,
        role: "user",
        content: "Auto ID message",
      });

      const result = await repository.listByConversation(
        mockConversations[1].id
      );

      expect(result).toBeArrayOfSize(1);
      expect(result[0]?.id).toEqual(message.id);
      expect(result[0]?.createdAt).toBeDefined();
      expect(result[0]?.updatedAt).toBeDefined();
    });
  });
});
