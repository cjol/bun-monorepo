import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleTimeEntryChangeLogRepository } from "./TimeEntryChangeLogRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import {
  createFullTestContext,
  createTestTimeEntry,
  type FullTestContext,
} from "../test-utils/seed";

describe("DrizzleTimeEntryChangeLogRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleTimeEntryChangeLogRepository>;
  let context: FullTestContext;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleTimeEntryChangeLogRepository({ db });

    context = await createFullTestContext(db, {
      timeEntryOverrides: {
        description: "Original entry",
        hours: 2.0,
      },
    });
  });

  describe("insert", () => {
    it("should insert a new change log entry", async () => {
      const beforeData = {
        ...context.timeEntry,
        hours: 2.0,
        description: "Original",
      };
      const afterData = {
        ...context.timeEntry,
        hours: 3.0,
        description: "Updated",
      };

      const changeLog = await repository.insert({
        timeEntryId: context.timeEntry.id,
        beforeData,
        afterData,
      });

      expect(changeLog).toMatchObject({
        timeEntryId: context.timeEntry.id,
        beforeData: beforeData,
        afterData: afterData,
        changedAt: expect.any(Date),
      });
    });

    it("should handle beforeData as null for initial creation", async () => {
      const afterData = {
        ...context.timeEntry,
        hours: 1.0,
        description: "New",
      };

      const changeLog = await repository.insert({
        timeEntryId: context.timeEntry.id,
        beforeData: null,
        afterData,
      });

      expect(changeLog).toMatchObject({
        timeEntryId: context.timeEntry.id,
        beforeData: null,
        afterData: afterData,
        changedAt: expect.any(Date),
      });
    });
  });

  describe("listByTimeEntry", () => {
    it("should return empty array when no change logs exist", async () => {
      const results = await repository.listByTimeEntry(context.timeEntry.id);
      expect(results).toEqual([]);
    });

    it("should return all change logs for a time entry", async () => {
      await repository.insert({
        timeEntryId: context.timeEntry.id,
        afterData: {
          ...context.timeEntry,
          hours: 2.5,
          description: "Change 1",
        },
      });
      await repository.insert({
        timeEntryId: context.timeEntry.id,
        beforeData: {
          ...context.timeEntry,
          hours: 2.5,
          description: "Change 1",
        },
        afterData: {
          ...context.timeEntry,
          hours: 3.0,
          description: "Change 2",
        },
      });

      const results = await repository.listByTimeEntry(context.timeEntry.id);

      expect(results).toHaveLength(2);
      expect(results[0]?.timeEntryId).toBe(context.timeEntry.id);
      expect(results[1]?.timeEntryId).toBe(context.timeEntry.id);
    });

    it("should only return change logs for the specified time entry", async () => {
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

      await repository.insert({
        timeEntryId: context.timeEntry.id,
        afterData: {
          ...context.timeEntry,
          hours: 2.5,
          description: "Change 1",
        },
      });
      await repository.insert({
        timeEntryId: timeEntry2.id,
        afterData: { ...timeEntry2, hours: 1.5, description: "Change 2" },
      });

      const results = await repository.listByTimeEntry(timeEntry2.id);

      expect(results).toHaveLength(1);
      expect(results[0]?.timeEntryId).toBe(timeEntry2.id);
    });
  });
});
