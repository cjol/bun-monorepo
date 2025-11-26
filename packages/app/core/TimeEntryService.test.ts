import { describe, it, expect, beforeEach } from "bun:test";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { TimeEntryService } from "./TimeEntryService";
import {
  createTimeTrackingTestContext,
  type TimeTrackingTestContext,
} from "@ai-starter/db/test-utils";

describe("TimeEntryService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof TimeEntryService>;
  let context: TimeTrackingTestContext;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = TimeEntryService({ repos });

    context = await createTimeTrackingTestContext(db, { withBill: true });
  });

  describe("createTimeEntry", () => {
    it("should create a new time entry", async () => {
      const result = await service.createTimeEntry({
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      expect(result).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should create a change log entry on creation", async () => {
      const result = await service.createTimeEntry({
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: null,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      const logs = await repos.timeEntryChangeLog.listByTimeEntry(result.id);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual({
        id: expect.any(String),
        timeEntryId: result.id,
        beforeData: null,
        afterData: {
          id: result.id,
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: null,
          date: result.date,
          hours: 2.5,
          description: "Client consultation",
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
        changedAt: expect.any(Date),
      });
    });
  });
  describe("updateTimeEntry", () => {
    it("should update time entry fields", async () => {
      const created = await service.createTimeEntry({
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateTimeEntry(created.id, {
        hours: 3.0,
        description: "Updated client consultation",
      });

      expect(result).toEqual({
        id: created.id,
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: new Date("2024-01-15"),
        hours: 3.0,
        description: "Updated client consultation",
        createdAt: created.createdAt,
        updatedAt: expect.any(Date),
      });
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime()
      );
    });

    it("should create a change log entry on update", async () => {
      const created = await service.createTimeEntry({
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateTimeEntry(created.id, {
        hours: 3.0,
      });

      const logs = await repos.timeEntryChangeLog.listByTimeEntry(result.id);
      expect(logs).toHaveLength(2); // One for creation, one for update

      const updateLog = logs[1];
      expect(updateLog).toBeDefined();
      expect(updateLog!.beforeData).toEqual({
        id: created.id,
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: created.date,
        hours: 2.5,
        description: "Client consultation",
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(updateLog!.afterData).toEqual({
        id: result.id,
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: result.date,
        hours: 3.0,
        description: "Client consultation",
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    });
  });
});
