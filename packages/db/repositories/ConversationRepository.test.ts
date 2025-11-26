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

      expect(result).toMatchObject({
        id: "00000000-0000-4000-8000-000000000001",
        title: "First Conversation",
      });
    });
  });

  describe("create", () => {
    it("should create a new conversation with a title", async () => {
      const conversation = await repository.create({
        title: "New Conversation",
      });

      const result = await repository.get(conversation.id);

      expect(result).toMatchObject({
        title: "New Conversation",
      });
    });

    it("should create a new conversation without a title", async () => {
      const conversation = await repository.create({});

      const result = await repository.get(conversation.id);

      expect(result).not.toBeNull();
      expect(result?.title).toBeNull();
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
