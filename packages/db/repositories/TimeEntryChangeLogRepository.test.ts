import { describe, it, expect, beforeEach } from "bun:test";
import { timeEntrySchema, matterSchema } from "@ai-starter/core";
import { DrizzleTimeEntryChangeLogRepository } from "./TimeEntryChangeLogRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleTimeEntryChangeLogRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleTimeEntryChangeLogRepository>;
  let timeEntryId: string;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleTimeEntryChangeLogRepository({ db });

    // Create a matter for foreign key reference
    const [matter] = await db
      .insert(matterSchema)
      .values({
        clientName: "Test Client",
        matterName: "Test Matter",
      })
      .returning();
    if (!matter) throw new Error("Failed to create matter");

    // Create a time entry for foreign key reference
    const [timeEntry] = await db
      .insert(timeEntrySchema)
      .values({
        matterId: matter.id,
        date: new Date("2024-01-15"),
        hours: 2.0,
        description: "Original entry",
      })
      .returning();
    if (!timeEntry) throw new Error("Failed to create timeEntry");
    timeEntryId = timeEntry.id;
  });

  describe("insert", () => {
    it("should insert a new change log entry", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix

      const changeLog = await repository.insert({
        id: "test-id",
        timeEntryId,
        beforeData: { hours: 2.0, description: "Original" },
        afterData: { hours: 3.0, description: "Updated" },
        changedAt: now,
      });

      expect(changeLog.id).toBe("test-id");
      expect(changeLog.timeEntryId).toBe(timeEntryId);
      expect(changeLog.beforeData).toEqual({
        hours: 2.0,
        description: "Original",
      });
      expect(changeLog.afterData).toEqual({
        hours: 3.0,
        description: "Updated",
      });
      expect(changeLog.changedAt).toEqual(now);
    });

    it("should assign an ID and timestamp for a new change log", async () => {
      const changeLog = await repository.insert({
        timeEntryId,
        afterData: { hours: 3.0, description: "Updated" },
      });

      expect(changeLog.id).toBeDefined();
      expect(changeLog.changedAt).toBeDefined();
      expect(changeLog.beforeData).toBeNull();
      expect(changeLog.afterData).toEqual({
        hours: 3.0,
        description: "Updated",
      });
    });

    it("should handle beforeData as null for initial creation", async () => {
      const changeLog = await repository.insert({
        timeEntryId,
        beforeData: null,
        afterData: { hours: 1.0, description: "New" },
      });

      expect(changeLog.beforeData).toBeNull();
      expect(changeLog.afterData).toEqual({ hours: 1.0, description: "New" });
    });
  });

  describe("listByTimeEntry", () => {
    it("should return empty array when no change logs exist", async () => {
      const results = await repository.listByTimeEntry(timeEntryId);
      expect(results).toEqual([]);
    });

    it("should return all change logs for a time entry", async () => {
      await repository.insert({
        timeEntryId,
        afterData: { hours: 2.5, description: "Change 1" },
      });
      await repository.insert({
        timeEntryId,
        beforeData: { hours: 2.5, description: "Change 1" },
        afterData: { hours: 3.0, description: "Change 2" },
      });

      const results = await repository.listByTimeEntry(timeEntryId);

      expect(results).toHaveLength(2);
      expect(results[0]?.timeEntryId).toBe(timeEntryId);
      expect(results[1]?.timeEntryId).toBe(timeEntryId);
    });

    it("should only return change logs for the specified time entry", async () => {
      // Create another time entry
      const [matter2] = await db
        .insert(matterSchema)
        .values({
          clientName: "Client 2",
          matterName: "Matter 2",
        })
        .returning();
      if (!matter2) throw new Error("Failed to create matter2");
      const [timeEntry2] = await db
        .insert(timeEntrySchema)
        .values({
          matterId: matter2.id,
          date: new Date("2024-01-16"),
          hours: 1.0,
          description: "Other entry",
        })
        .returning();
      if (!timeEntry2) throw new Error("Failed to create timeEntry2");

      await repository.insert({
        timeEntryId,
        afterData: { hours: 2.5, description: "Change 1" },
      });
      await repository.insert({
        timeEntryId: timeEntry2.id,
        afterData: { hours: 1.5, description: "Change 2" },
      });

      const results = await repository.listByTimeEntry(timeEntryId);

      expect(results).toHaveLength(1);
      expect(results[0]?.timeEntryId).toBe(timeEntryId);
    });
  });
});
