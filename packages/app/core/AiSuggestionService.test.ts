import { describe, it, expect, beforeEach } from "bun:test";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { AiSuggestionService } from "./AiSuggestionService";
import { TimeEntryService } from "./TimeEntryService";
import type { TimeEntry } from "@ai-starter/core";
import {
  createTimeTrackingTestContext,
  type TimeTrackingTestContext,
} from "@ai-starter/db/test-utils";
import { WorkflowService } from "./WorkflowService";
import { JobService } from "./JobService";
import { ActivityLogService } from "./ActivityLogService";

describe("AiSuggestionService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof AiSuggestionService>;
  let timeEntryService: ReturnType<typeof TimeEntryService>;
  let context: TimeTrackingTestContext;
  let timeEntry: TimeEntry;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    timeEntryService = TimeEntryService({
      repos,
      services: {
        workflow: WorkflowService({ repos }),
        job: JobService({ repos }),
        activityLog: ActivityLogService({ repos }),
      },
    });
    service = AiSuggestionService({
      repos,
      services: { timeEntry: timeEntryService },
    });

    context = await createTimeTrackingTestContext(db, { withBill: false });

    timeEntry = (
      await timeEntryService.createTimeEntries(context.matter.id, [
        {
          matterId: context.matter.id,
          timekeeperId: context.timekeeper.id,
          billId: null,
          date: new Date("2024-01-15"),
          hours: 2.5,
          description: "Client consultation",
        },
      ])
    )[0]!;
  });

  describe("approveSuggestion", () => {
    it("should approve suggestion and apply changes to time entry", async () => {
      const suggestion = await service.createSuggestion({
        timeEntryId: timeEntry.id,
        suggestedChanges: { ...timeEntry, hours: 3.5 },
        explanation: "Test explanation for hours change",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.approveSuggestion(suggestion.id);

      expect(result.status).toBe("approved");

      // Verify the time entry was updated
      const updatedTimeEntry = await timeEntryService.getTimeEntry(
        timeEntry.id
      );
      expect(updatedTimeEntry?.hours).toBe(3.5);

      // Verify a change log was created
      const logs = await repos.timeEntryChangeLog.listByTimeEntry(timeEntry.id);
      expect(logs.length).toBeGreaterThan(1);
    });

    it("should throw an error if suggestion does not exist", async () => {
      await expect(
        service.approveSuggestion("non-existent-id")
      ).rejects.toThrow();
    });

    it("should throw an error if suggestion is already approved", async () => {
      const suggestion = await service.createSuggestion({
        timeEntryId: timeEntry.id,
        suggestedChanges: { ...timeEntry, hours: 3.5 },
        explanation: "Test explanation for hours change",
      });

      await service.approveSuggestion(suggestion.id);

      await expect(service.approveSuggestion(suggestion.id)).rejects.toThrow();
    });
  });

  describe("rejectSuggestion", () => {
    it("should reject a suggestion without applying changes", async () => {
      const suggestion = await service.createSuggestion({
        timeEntryId: timeEntry.id,
        suggestedChanges: { ...timeEntry, hours: 3.5 },
        explanation: "Test explanation for hours change",
      });

      const result = await service.rejectSuggestion(suggestion.id);

      expect(result.status).toBe("rejected");

      // Verify the time entry was NOT updated
      const dbTimeEntry = await timeEntryService.getTimeEntry(timeEntry.id);
      expect(dbTimeEntry?.hours).toBe(2.5);
    });

    it("should throw an error if suggestion does not exist", async () => {
      await expect(
        service.rejectSuggestion("non-existent-id")
      ).rejects.toThrow();
    });
  });
});
