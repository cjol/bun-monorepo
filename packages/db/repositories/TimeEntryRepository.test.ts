import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleTimeEntryRepository } from "./TimeEntryRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import {
  createTestMatter,
  createTimeTrackingTestContext,
  type TimeTrackingTestContext,
} from "../test-utils/seed";

describe("DrizzleTimeEntryRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleTimeEntryRepository>;
  let context: TimeTrackingTestContext;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleTimeEntryRepository({ db });

    context = await createTimeTrackingTestContext(db, { withBill: true });
  });

  describe("get", () => {
    it("should return null when time entry does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return time entry when it exists", async () => {
      const timeEntries = await repository.createMany([
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: context.bill!.id,
          date: new Date("2024-01-15"),
          hours: 2.5,
          description: "Worked on something",
        },
      ]);
      const timeEntry = timeEntries[0];
      if (!timeEntry) throw new Error("Failed to create time entry");
      const result = await repository.get(timeEntry.id);

      expect(result).toMatchObject({
        id: timeEntry.id,
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        hours: 2.5,
      });
    });
  });

  describe("update", () => {
    it("should update a time entry", async () => {
      const timeEntries = await repository.createMany([
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          date: new Date("2024-01-15"),
          hours: 2.0,
          description: "Original description",
        },
      ]);

      const timeEntry = timeEntries[0];
      if (!timeEntry) throw new Error("Failed to create time entry");

      const updated = await repository.update(timeEntry.id, {
        hours: 3.0,
        description: "Updated description",
      });

      expect(updated).toMatchObject({
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        date: new Date("2024-01-15"),
        id: timeEntry.id,
        hours: 3.0,
        description: "Updated description",
      });
    });

    it("should throw notFound when time entry does not exist", async () => {
      expect(
        repository.update("non-existent-id", { hours: 1.0 })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a time entry", async () => {
      const timeEntries = await repository.createMany([
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: context.bill!.id,
          date: new Date("2024-01-15"),
          hours: 2.5,
          description: "Worked on something",
        },
      ]);

      const timeEntry = timeEntries[0];
      if (!timeEntry) throw new Error("Failed to create time entry");

      await repository.delete(timeEntry.id);
      const result = await repository.get(timeEntry.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when time entry does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listByMatter", () => {
    it("should return empty array when no time entries exist", async () => {
      const results = await repository.listByMatter(context.matter.id);
      expect(results).toEqual([]);
    });

    it("should return all time entries", async () => {
      await repository.createMany([
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          date: new Date("2024-01-15"),
          hours: 1.0,
          description: "Entry 1",
        },
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          date: new Date("2024-01-16"),
          hours: 2.0,
          description: "Entry 2",
        },
      ]);

      const results = await repository.listByMatter(context.matter.id);

      expect(results).toHaveLength(2);
    });

    it("should return time entries for specific matter", async () => {
      // Create another matter
      const matter2 = await createTestMatter(db, {
        clientName: "Client 2",
        matterName: "Matter 2",
      });

      await repository.createMany([
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          date: new Date("2024-01-15"),
          hours: 1.0,
          description: "Entry 1",
        },
        {
          matterId: matter2.id,
          timekeeperId: context.timekeeper.id, // technically this is illegal because the timekeeper isn't defined within the matter, but it's fine for testing
          date: new Date("2024-01-15"),
          hours: 2.0,
          description: "Entry 2",
        },
      ]);

      const results = await repository.listByMatter(context.matter.id);

      expect(results).toHaveLength(1);
      expect(results[0]?.matterId).toBe(context.matter.id);
    });
  });

  describe("listByMatterAndBill", () => {
    it("should return empty array when no time entries for bill", async () => {
      const results = await repository.listByMatterAndBill(
        context.matter.id,
        context.bill!.id
      );
      expect(results).toEqual([]);
    });

    it("should return time entries for specific bill", async () => {
      await repository.createMany([
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: context.bill!.id,
          date: new Date("2024-01-15"),
          hours: 1.0,
          description: "Entry 1",
        },
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          date: new Date("2024-01-15"),
          hours: 2.0,
          description: "Entry 2",
        },
      ]);

      const results = await repository.listByMatterAndBill(
        context.matter.id,
        context.bill!.id
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.billId).toBe(context.bill!.id);
    });
  });
});
