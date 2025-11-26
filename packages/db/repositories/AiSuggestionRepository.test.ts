import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleAiSuggestionRepository } from "./AiSuggestionRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import {
  createFullTestContext,
  createTestTimeEntry,
  type FullTestContext,
} from "../test-utils/seed";

describe("DrizzleAiSuggestionRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleAiSuggestionRepository>;
  let context: FullTestContext;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleAiSuggestionRepository({ db });

    context = await createFullTestContext(db, {
      timeEntryOverrides: {
        description: "Original entry",
        hours: 2.0,
      },
    });
  });

  describe("get", () => {
    it("should return null when suggestion does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return suggestion when it exists", async () => {
      const suggestion = await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 3.0 },
      });

      const result = await repository.get(suggestion.id);

      expect(result).toEqual(suggestion);
    });
  });

  describe("create", () => {
    it("should create a new AI suggestion", async () => {
      const suggestion = await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: {
          ...context.timeEntry,
          hours: 3.5,
          description: "Updated",
        },
        status: "pending",
      });

      expect(suggestion).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        timeEntryId: context.timeEntry.id,
        status: "pending",
        suggestedChanges: expect.objectContaining({
          hours: 3.5,
          description: "Updated",
        }),
      });
    });
  });

  describe("updateStatus", () => {
    it("should update suggestion status to approved", async () => {
      const suggestion = await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 3.0 },
      });

      const updated = await repository.updateStatus(suggestion.id, "approved");

      expect(updated.status).toBe("approved");
    });

    it("should update suggestion status to rejected", async () => {
      const suggestion = await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 3.0 },
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
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 3.0 },
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
      const results = await repository.listByMatter(context.matter.id);
      expect(results).toEqual([]);
    });

    it("should return all suggestions for matter", async () => {
      await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 2.5 },
      });
      await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 3.5 },
      });

      const results = await repository.listByMatter(context.matter.id);

      expect(results).toHaveLength(2);
    });
  });

  describe("listByTimeEntry", () => {
    it("should return empty array when no suggestions for time entry", async () => {
      const results = await repository.listByTimeEntry(context.timeEntry.id);
      expect(results).toEqual([]);
    });

    it("should return suggestions for specific time entry", async () => {
      // Create another time entry
      const timeEntry2 = await createTestTimeEntry(
        db,
        context.matter.id,
        context.timekeeper.id,
        {
          date: new Date("2024-01-16"),
          hours: 1.0,
          description: "Other entry",
        }
      );

      await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 2.5 },
      });
      await repository.create({
        timeEntryId: timeEntry2.id,
        suggestedChanges: { ...timeEntry2, hours: 1.5 },
      });

      const results = await repository.listByTimeEntry(timeEntry2.id);

      expect(results).toHaveLength(1);
      expect(results[0]?.timeEntryId).toBe(timeEntry2.id);
    });
  });

  describe("listByMatterAndStatus", () => {
    it("should return suggestions with pending status", async () => {
      await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 2.5 },
        status: "pending",
      });
      await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 3.5 },
        status: "approved",
      });

      const results = await repository.listByMatterAndStatus(
        context.matter.id,
        "pending"
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe("pending");

      const approvedResults = await repository.listByMatterAndStatus(
        context.matter.id,
        "approved"
      );

      expect(approvedResults).toHaveLength(1);
      expect(approvedResults[0]?.status).toBe("approved");
    });

    it("should return empty array when no suggestions match status", async () => {
      await repository.create({
        timeEntryId: context.timeEntry.id,
        suggestedChanges: { ...context.timeEntry, hours: 2.5 },
        status: "pending",
      });

      const results = await repository.listByMatterAndStatus(
        context.matter.id,
        "rejected"
      );

      expect(results).toEqual([]);
    });
  });
});
