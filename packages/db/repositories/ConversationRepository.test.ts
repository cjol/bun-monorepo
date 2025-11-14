import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleConversationRepository } from "./ConversationRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { mockConversations } from "../test-utils";

describe("DrizzleConversationRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleConversationRepository>;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleConversationRepository({ db });
  });

  describe("list", () => {
    it("should return all conversations ordered by most recent first", async () => {
      const result = await repository.list();

      expect(result).toHaveLength(2);
      // Results should be ordered by createdAt desc
      expect(result[0]?.id).toBe(mockConversations[0]?.id);
    });

    it("should return empty array when no conversations exist", async () => {
      const freshDb = await testDB({ seed: false });
      const freshRepo = DrizzleConversationRepository({ db: freshDb });

      const result = await freshRepo.list();

      expect(result).toHaveLength(0);
    });
  });

  describe("get", () => {
    it("should return null when conversation does not exist", async () => {
      const result = await repository.get(
        "00000000-0000-4000-8000-999999999999"
      );
      expect(result).toBeNull();
    });

    it("should return conversation when it exists", async () => {
      const result = await repository.get(
        "00000000-0000-4000-8000-000000000001"
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("00000000-0000-4000-8000-000000000001");
      expect(result?.title).toBe("First Conversation");
    });
  });

  describe("create", () => {
    it("should create a new conversation with a title", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix
      const conversation = await repository.create({
        id: "00000000-0000-4000-8000-000000000099",
        title: "New Conversation",
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.get(conversation.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("00000000-0000-4000-8000-000000000099");
      expect(result?.title).toBe("New Conversation");
      expect(result?.createdAt).toEqual(now);
    });

    it("should create a new conversation without a title", async () => {
      const now = new Date();
      now.setMilliseconds(0);
      const conversation = await repository.create({
        id: "00000000-0000-4000-8000-000000000098",
        title: null,
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.get(conversation.id);

      expect(result).not.toBeNull();
      expect(result?.title).toBeNull();
    });

    it("should auto-generate ID and timestamps for a new conversation", async () => {
      const conversation = await repository.create({
        title: "Auto ID",
      });

      const result = await repository.get(conversation.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete a conversation", async () => {
      await repository.delete("00000000-0000-4000-8000-000000000001");

      const result = await repository.get(
        "00000000-0000-4000-8000-000000000001"
      );
      expect(result).toBeNull();
    });

    it("should not throw an error when deleting non-existent conversation", async () => {
      await repository.delete("00000000-0000-4000-8000-999999999999");
      // If we reach here, the delete succeeded without throwing
      expect(true).toBe(true);
    });
  });
});
