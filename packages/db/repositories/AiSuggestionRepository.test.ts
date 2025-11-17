import { describe, it, expect, beforeEach } from "bun:test";
import { aiSuggestionSchema, matterSchema } from "@ai-starter/core";
import { DrizzleAiSuggestionRepository } from "./AiSuggestionRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { doSeedRoles, createTestTimekeeper } from "../test-utils/seed";

describe("DrizzleAiSuggestionRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleAiSuggestionRepository>;
  let matterId: string;
  let timeEntryId: string;
  let timekeeperId: string;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleAiSuggestionRepository({ db });

    // Create roles
    await doSeedRoles(db);

    // Create dependencies for foreign keys
    const [matter] = await db
      .insert(matterSchema)
      .values({
        clientName: "Test Client",
        matterName: "Test Matter",
      })
      .returning();
    if (!matter) throw new Error("Failed to create matter");
    matterId = matter.id;

    // Create timekeeper
    const timekeeper = await createTestTimekeeper(db, matterId);
    if (!timekeeper) throw new Error("Failed to create timekeeper");
    timekeeperId = timekeeper.id;

    // Create time entry
    const { timeEntrySchema } = await import("@ai-starter/core");
    const [timeEntry] = await db
      .insert(timeEntrySchema)
      .values({
        matterId: matter.id,
        timekeeperId,
        date: new Date("2024-01-15"),
        hours: 2.0,
        description: "Original entry",
      })
      .returning();
    if (!timeEntry) throw new Error("Failed to create timeEntry");
    timeEntryId = timeEntry.id;
  });

  describe("get", () => {
    it("should return null when suggestion does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return suggestion when it exists", async () => {
      await db.insert(aiSuggestionSchema).values({
        id: "test-id",
        timeEntryId,
        suggestedChanges: { hours: 3.0 },
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.get("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.status).toBe("pending");
    });
  });

  describe("create", () => {
    it("should create a new AI suggestion", async () => {
      const now = new Date();
      now.setMilliseconds(0);

      const suggestion = await repository.create({
        id: "new-id",
        timeEntryId,
        suggestedChanges: { hours: 3.5, description: "Updated" },
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      expect(suggestion.id).toBe("new-id");
      expect(suggestion.timeEntryId).toBe(timeEntryId);
      expect(suggestion.suggestedChanges).toEqual({
        hours: 3.5,
        description: "Updated",
      });
      expect(suggestion.status).toBe("pending");
    });

    it("should assign an ID and timestamps with default pending status", async () => {
      const suggestion = await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 2.5 },
      });

      expect(suggestion.id).toBeDefined();
      expect(suggestion.createdAt).toBeDefined();
      expect(suggestion.updatedAt).toBeDefined();
      expect(suggestion.status).toBe("pending");
    });
  });

  describe("updateStatus", () => {
    it("should update suggestion status to approved", async () => {
      const suggestion = await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 3.0 },
      });

      const updated = await repository.updateStatus(suggestion.id, "approved");

      expect(updated.status).toBe("approved");
      expect(updated.id).toBe(suggestion.id);
    });

    it("should update suggestion status to rejected", async () => {
      const suggestion = await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 3.0 },
      });

      const updated = await repository.updateStatus(suggestion.id, "rejected");

      expect(updated.status).toBe("rejected");
    });

    it("should throw notFound when suggestion does not exist", async () => {
      expect(
        repository.updateStatus("non-existent-id", "approved")
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a suggestion", async () => {
      const suggestion = await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 3.0 },
      });

      await repository.delete(suggestion.id);
      const result = await repository.get(suggestion.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when suggestion does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listByMatter", () => {
    it("should return empty array when no suggestions exist", async () => {
      const results = await repository.listByMatter(matterId);
      expect(results).toEqual([]);
    });

    it("should return all suggestions for matter", async () => {
      await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 2.5 },
      });
      await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 3.5 },
      });

      const results = await repository.listByMatter(matterId);

      expect(results).toHaveLength(2);
    });
  });

  describe("listByTimeEntry", () => {
    it("should return empty array when no suggestions for time entry", async () => {
      const results = await repository.listByTimeEntry(timeEntryId);
      expect(results).toEqual([]);
    });

    it("should return suggestions for specific time entry", async () => {
      // Create another time entry
      const [matter2] = await db
        .insert(matterSchema)
        .values({
          clientName: "Client 2",
          matterName: "Matter 2",
        })
        .returning();
      if (!matter2) throw new Error("Failed to create matter2");

      const timekeeper2 = await createTestTimekeeper(
        db,
        matter2.id,
        "role-associate",
        { email: "test2@example.com" }
      );
      if (!timekeeper2) throw new Error("Failed to create timekeeper2");

      const { timeEntrySchema } = await import("@ai-starter/core");
      const [timeEntry2] = await db
        .insert(timeEntrySchema)
        .values({
          matterId: matter2.id,
          timekeeperId: timekeeper2.id,
          date: new Date("2024-01-16"),
          hours: 1.0,
          description: "Other entry",
        })
        .returning();
      if (!timeEntry2) throw new Error("Failed to create timeEntry2");

      await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 2.5 },
      });
      await repository.create({
        timeEntryId: timeEntry2.id,
        suggestedChanges: { hours: 1.5 },
      });

      const results = await repository.listByTimeEntry(timeEntryId);

      expect(results).toHaveLength(1);
      expect(results[0]?.timeEntryId).toBe(timeEntryId);
    });
  });

  describe("listByMatterAndStatus", () => {
    it("should return suggestions with pending status", async () => {
      await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 2.5 },
        status: "pending",
      });
      await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 3.5 },
        status: "approved",
      });

      const results = await repository.listByMatterAndStatus(
        matterId,
        "pending"
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe("pending");
    });

    it("should return suggestions with approved status", async () => {
      const s1 = await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 2.5 },
      });
      await repository.updateStatus(s1.id, "approved");

      const results = await repository.listByMatterAndStatus(
        matterId,
        "approved"
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe("approved");
    });

    it("should return empty array when no suggestions match status", async () => {
      await repository.create({
        timeEntryId,
        suggestedChanges: { hours: 2.5 },
        status: "pending",
      });

      const results = await repository.listByMatterAndStatus(
        matterId,
        "rejected"
      );

      expect(results).toEqual([]);
    });
  });
});
