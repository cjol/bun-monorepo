import { describe, it, expect, beforeEach } from "bun:test";
import {
  testDB,
  doSeedRoles,
  createTestTimekeeper,
} from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { TimeEntryService } from "./TimeEntryService";
import { MatterService } from "./MatterService";
import { BillService } from "./BillService";

describe("TimeEntryService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof TimeEntryService>;
  let matterService: ReturnType<typeof MatterService>;
  let billService: ReturnType<typeof BillService>;
  let matterId: string;
  let billId: string;
  let timekeeperId: string;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = TimeEntryService({ repos });
    matterService = MatterService({ repos });
    billService = BillService({ repos });

    // Seed roles
    await doSeedRoles(db);

    const matter = await matterService.createMatter({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: null,
    });
    matterId = matter.id;

    // Create timekeeper
    const timekeeper = await createTestTimekeeper(db, matterId);
    if (!timekeeper) throw new Error("Failed to create timekeeper");
    timekeeperId = timekeeper.id;

    const bill = await billService.createBill({
      matterId,
      periodStart: new Date("2024-01-01"),
      periodEnd: new Date("2024-01-31"),
      status: "draft",
    });
    billId = bill.id;
  });

  describe("getTimeEntry", () => {
    it("should return a time entry by id", async () => {
      const created = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      const result = await service.getTimeEntry(created.id);
      expect(result).toEqual(created);
    });

    it("should return null if time entry does not exist", async () => {
      const result = await service.getTimeEntry("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("createTimeEntry", () => {
    it("should validate and create a new time entry", async () => {
      const result = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      expect(result).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should create a change log entry on creation", async () => {
      const result = await service.createTimeEntry({
        matterId,
        timekeeperId,
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
          matterId,
          timekeeperId,
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
        matterId,
        timekeeperId,
        billId,
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
        matterId,
        timekeeperId,
        billId,
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
        matterId,
        timekeeperId,
        billId,
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
        matterId,
        timekeeperId,
        billId,
        date: created.date,
        hours: 2.5,
        description: "Client consultation",
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(updateLog!.afterData).toEqual({
        id: result.id,
        matterId,
        timekeeperId,
        billId,
        date: result.date,
        hours: 3.0,
        description: "Client consultation",
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    });
  });

  describe("deleteTimeEntry", () => {
    it("should delete a time entry", async () => {
      const created = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      await service.deleteTimeEntry(created.id);

      const result = await service.getTimeEntry(created.id);
      expect(result).toBeNull();
    });
  });

  describe("listByMatter", () => {
    it("should list all time entries for a matter", async () => {
      const entry1 = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      const entry2 = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId: null,
        date: new Date("2024-01-16"),
        hours: 1.5,
        description: "Legal research",
      });

      const result = await service.listByMatter(matterId);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(entry1);
      expect(result).toContainEqual(entry2);
    });

    it("should return empty array if no time entries exist", async () => {
      const result = await service.listByMatter(matterId);
      expect(result).toEqual([]);
    });
  });

  describe("listByBill", () => {
    it("should list all time entries for a bill", async () => {
      const entry1 = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
      });

      const entry2 = await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date("2024-01-16"),
        hours: 1.5,
        description: "Legal research",
      });

      await service.createTimeEntry({
        matterId,
        timekeeperId,
        billId: null,
        date: new Date("2024-01-17"),
        hours: 1.0,
        description: "Unbilled work",
      });

      const result = await service.listByBill(matterId, billId);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(entry1);
      expect(result).toContainEqual(entry2);
    });

    it("should return empty array if no time entries exist", async () => {
      const result = await service.listByBill(matterId, billId);
      expect(result).toEqual([]);
    });
  });
});
