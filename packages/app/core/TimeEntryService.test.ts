import { describe, it, expect, beforeEach } from "bun:test";
import {
  createTestMatter,
  createTestTimekeeper,
} from "@ai-starter/db/test-utils";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { TimeEntryService } from "./TimeEntryService";
import {
  createTimeTrackingTestContext,
  type TimeTrackingTestContext,
} from "@ai-starter/db/test-utils";
import { WorkflowService } from "./WorkflowService";
import { JobService } from "./JobService";

describe("TimeEntryService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof TimeEntryService>;
  let context: TimeTrackingTestContext;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = TimeEntryService({
      repos,
      services: {
        workflow: WorkflowService({ repos }),
        job: JobService({ repos }),
      },
    });

    context = await createTimeTrackingTestContext(db, { withBill: true });
  });

  describe("createTimeEntries", () => {
    it("should create a new time entry", async () => {
      const [result] = await service.createTimeEntries(context.matter.id, [
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: context.bill!.id,
          date: new Date("2024-01-15"),
          hours: 2.5,
          description: "Client consultation",
        },
      ]);

      expect(result).toEqual({
        id: expect.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
        matterId: context.matter.id,
        timekeeperId: context.timekeeper.id,
        billId: context.bill!.id,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Client consultation",
        metadata: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should create a change log entry on creation", async () => {
      const results = await service.createTimeEntries(context.matter.id, [
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: null,
          date: new Date("2024-01-15"),
          hours: 2.5,
          description: "Client consultation",
        },
      ]);

      const result = results[0];
      if (!result) throw new Error("Failed to create time entry");

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
          metadata: {},
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
        reason: null,
        changedAt: expect.any(Date),
      });
    });

    it("should reject creating a time entry when timekeeper has no role in matter", async () => {
      // Create a different matter without assigning the timekeeper to it
      const otherMatter = await createTestMatter(db);
      if (!otherMatter) throw new Error("Failed to create other matter");

      await expect(
        service.createTimeEntries(otherMatter.id, [
          {
            matterId: otherMatter.id,
            timekeeperId: context.timekeeper.id,
            billId: null,
            date: new Date("2024-01-15"),
            hours: 2.5,
            description: "Client consultation",
          },
        ])
      ).rejects.toThrow(
        `Timekeeper ${context.timekeeper.id} does not have a role within matter ${otherMatter.id}`
      );
    });
  });
  describe("updateTimeEntry", () => {
    it("should update time entry fields", async () => {
      const createdResults = await service.createTimeEntries(
        context.matter.id,
        [
          {
            matterId: context.matter.id,
            timekeeperId: context.timekeeper.id,
            billId: context.bill!.id,
            date: new Date("2024-01-15"),
            hours: 2.5,
            description: "Client consultation",
          },
        ]
      );

      const created = createdResults[0];
      if (!created) throw new Error("Failed to create time entry");

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
        metadata: {},
        createdAt: created.createdAt,
        updatedAt: expect.any(Date),
      });
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime()
      );
    });

    it("should create a change log entry on update", async () => {
      const updateTestResults = await service.createTimeEntries(
        context.matter.id,
        [
          {
            matterId: context.matter.id,
            timekeeperId: context.timekeeper.id,
            billId: context.bill!.id,
            date: new Date("2024-01-15"),
            hours: 2.5,
            description: "Client consultation",
          },
        ]
      );

      const created = updateTestResults[0];
      if (!created) throw new Error("Failed to create time entry");

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateTimeEntry(created.id, {
        hours: 3.0,
      });

      const logs = await repos.timeEntryChangeLog.listByTimeEntry(result.id);
      expect(logs).toHaveLength(2); // One for creation, one for update

      const updateLog = logs[1];
      expect(updateLog).toBeDefined();
      expect(updateLog!.beforeData).toEqual(created);
      expect(updateLog!.afterData).toEqual(result);
    });

    it("should reject updating time entry to a matter where timekeeper has no role", async () => {
      const rejectTestResults = await service.createTimeEntries(
        context.matter.id,
        [
          {
            matterId: context.matter.id,
            timekeeperId: context.timekeeper.id,
            billId: context.bill!.id,
            date: new Date("2024-01-15"),
            hours: 2.5,
            description: "Client consultation",
          },
        ]
      );

      const created = rejectTestResults[0];
      if (!created) throw new Error("Failed to create time entry");

      // Create a different matter without assigning the timekeeper to it
      const otherMatter = await createTestMatter(db);
      if (!otherMatter) throw new Error("Failed to create other matter");

      await expect(
        service.updateTimeEntry(created.id, {
          matterId: otherMatter.id,
        })
      ).rejects.toThrow(
        `Timekeeper ${context.timekeeper.id} does not have a role within matter ${otherMatter.id}`
      );
    });

    it("should reject updating time entry to a timekeeper who has no role in the matter", async () => {
      const timekeeperTestResults = await service.createTimeEntries(
        context.matter.id,
        [
          {
            matterId: context.matter.id,
            timekeeperId: context.timekeeper.id,
            billId: context.bill!.id,
            date: new Date("2024-01-15"),
            hours: 2.5,
            description: "Client consultation",
          },
        ]
      );

      const created = timekeeperTestResults[0];
      if (!created) throw new Error("Failed to create time entry");

      // Create a different timekeeper without assigning them to the matter
      const otherTimekeeper = await createTestTimekeeper(db, {
        name: "Other Timekeeper",
        email: "other@example.com",
      });
      if (!otherTimekeeper)
        throw new Error("Failed to create other timekeeper");

      await expect(
        service.updateTimeEntry(created.id, {
          timekeeperId: otherTimekeeper.id,
        })
      ).rejects.toThrow(
        `Timekeeper ${otherTimekeeper.id} does not have a role within matter ${context.matter.id}`
      );
    });
  });
});
