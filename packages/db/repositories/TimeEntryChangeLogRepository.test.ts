import { describe, it, expect, beforeEach } from "bun:test";
import { timeEntrySchema, matterSchema } from "@ai-starter/core";
import { DrizzleTimeEntryChangeLogRepository } from "./TimeEntryChangeLogRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { doSeedRoles, createTestTimekeeper } from "../test-utils/seed";

describe("DrizzleTimeEntryChangeLogRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleTimeEntryChangeLogRepository>;
  let timeEntryId: string;
  let timekeeperId: string;
  let timeEntry: typeof timeEntrySchema.$inferSelect;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleTimeEntryChangeLogRepository({ db });

    // Seed roles
    await doSeedRoles(db);

    // Create a matter for foreign key reference
    const [matter] = await db
      .insert(matterSchema)
      .values({
        clientName: "Test Client",
        matterName: "Test Matter",
      })
      .returning();
    if (!matter) throw new Error("Failed to create matter");

    // Create timekeeper
    const timekeeper = await createTestTimekeeper(db, matter.id);
    if (!timekeeper) throw new Error("Failed to create timekeeper");
    timekeeperId = timekeeper.id;

    // Create a time entry for foreign key reference
    const [entry] = await db
      .insert(timeEntrySchema)
      .values({
        matterId: matter.id,
        timekeeperId,
        date: new Date("2024-01-15"),
        hours: 2.0,
        description: "Original entry",
      })
      .returning();
    if (!entry) throw new Error("Failed to create timeEntry");
    timeEntry = entry;
    timeEntryId = entry.id;
  });

  describe("insert", () => {
    it("should insert a new change log entry", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix

      const beforeData = { ...timeEntry, hours: 2.0, description: "Original" };
      const afterData = { ...timeEntry, hours: 3.0, description: "Updated" };

      const changeLog = await repository.insert({
        timeEntryId,
        beforeData,
        afterData,
        changedAt: now,
      });

      expect(changeLog.timeEntryId).toBe(timeEntryId);
      expect(changeLog.beforeData?.hours).toBe(2.0);
      expect(changeLog.beforeData?.description).toBe("Original");
      expect(changeLog.afterData.hours).toBe(3.0);
      expect(changeLog.afterData.description).toBe("Updated");
      expect(changeLog.changedAt).toEqual(now);
    });

    it("should assign an ID and timestamp for a new change log", async () => {
      const afterData = { ...timeEntry, hours: 3.0, description: "Updated" };

      const changeLog = await repository.insert({
        timeEntryId,
        afterData,
      });

      expect(changeLog.id).toBeDefined();
      expect(changeLog.changedAt).toBeDefined();
      expect(changeLog.beforeData).toBeNull();
      expect(changeLog.afterData.hours).toBe(3.0);
      expect(changeLog.afterData.description).toBe("Updated");
    });

    it("should handle beforeData as null for initial creation", async () => {
      const afterData = { ...timeEntry, hours: 1.0, description: "New" };

      const changeLog = await repository.insert({
        timeEntryId,
        beforeData: null,
        afterData,
      });

      expect(changeLog.beforeData).toBeNull();
      expect(changeLog.afterData.hours).toBe(1.0);
      expect(changeLog.afterData.description).toBe("New");
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
        afterData: { ...timeEntry, hours: 2.5, description: "Change 1" },
      });
      await repository.insert({
        timeEntryId,
        beforeData: { ...timeEntry, hours: 2.5, description: "Change 1" },
        afterData: { ...timeEntry, hours: 3.0, description: "Change 2" },
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

      // Create timekeeper for matter2
      const timekeeper2 = await createTestTimekeeper(
        db,
        matter2.id,
        "role-associate",
        { email: "test2@example.com" }
      );
      if (!timekeeper2) throw new Error("Failed to create timekeeper2");

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

      await repository.insert({
        timeEntryId,
        afterData: { ...timeEntry, hours: 2.5, description: "Change 1" },
      });
      await repository.insert({
        timeEntryId: timeEntry2.id,
        afterData: { ...timeEntry2, hours: 1.5, description: "Change 2" },
      });

      const results = await repository.listByTimeEntry(timeEntryId);

      expect(results).toHaveLength(1);
      expect(results[0]?.timeEntryId).toBe(timeEntryId);
    });
  });
});
