import { describe, it, expect, beforeEach, mock } from "bun:test";
import { TimeEntryImportService } from "./TimeEntryImportService";
import type { DB } from "@ai-starter/db";
import { testDB } from "@ai-starter/db/test-utils";
import {
  createTimeTrackingTestContext,
  type TimeTrackingTestContext,
} from "@ai-starter/db/test-utils";
import type { TimeEntry } from "@ai-starter/core";
import { TimeEntryService } from "./TimeEntryService";
import type { CsvHeaderMappingService } from "./CsvHeaderMappingService";

describe("TimeEntryImportService", () => {
  let db: DB;
  let service: ReturnType<typeof TimeEntryImportService>;
  let context: TimeTrackingTestContext;
  const mockCsvMappingService = {
    mapCsvHeaders: mock<
      CsvHeaderMappingService["mapCsvHeaders"]
    >().mockResolvedValue({
      mapping: {
        date: "date",
        timekeeperName: "timekeeperName",
        hours: "hours",
        description: "description",
        billId: "billId",
        "metadata.phase": "metadata.phase",
        "metadata.taskCode": "metadata.taskCode",
      },
      confidence: 0.95,
    }),
  };

  beforeEach(async () => {
    db = await testDB();
    const { getRepos } = await import("@ai-starter/db");
    const repos = getRepos(db);

    // Setup test data with matter, timekeeper, and timekeeper role
    // (createTimeTrackingTestContext already seeds roles)
    context = await createTimeTrackingTestContext(db, { withBill: true });
    mockCsvMappingService.mapCsvHeaders.mockClear();

    service = TimeEntryImportService({
      repos,
      services: {
        timeEntry: TimeEntryService({ repos }),
        csvMapping: mockCsvMappingService,
      },
    });
  });

  describe("importTimeEntries", () => {
    it("should successfully import valid CSV with timekeeper name", async () => {
      const csv = `date,timekeeperName,hours,description
2025-01-15,${context.timekeeper.name},2.5,"Client meeting"
2025-01-16,${context.timekeeper.name},1.0,"Legal research"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(2);
        expect(result.imported).toHaveLength(2);
        expect(result.imported[0]?.description).toBe("Client meeting");
        expect(result.imported[0]?.hours).toBe(2.5);
        expect(result.imported[1]?.description).toBe("Legal research");
        expect(result.imported[1]?.hours).toBe(1.0);
      }
    });

    it("should create new timekeeper and assign placeholder role if name doesn't exist", async () => {
      const csv = `date,timekeeperName,hours,description
2025-01-15,New Lawyer,2.5,"Client meeting"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(1);

        // Verify timekeeper was created
        const { getRepos } = await import("@ai-starter/db");
        const repos = getRepos(db);
        const timekeepers = await repos.timekeeper.listAll();
        const newTimekeeper = timekeepers.find((t) => t.name === "New Lawyer");
        expect(newTimekeeper).toBeDefined();
        expect(newTimekeeper!.email).toContain("placeholder");

        // Verify timekeeper role was created with placeholder role
        const timekeeperRoles = await repos.timekeeperRole.listByMatter(
          context.matter.id
        );
        const newRole = timekeeperRoles.find(
          (tr) => tr.timekeeperId === newTimekeeper!.id
        );
        expect(newRole).toBeDefined();

        // Verify placeholder role exists
        const role = await repos.role.get(newRole!.roleId);
        expect(role).toBeDefined();
        expect(role!.name).toBe("Imported Timekeeper");
      }
    });

    it("should successfully import CSV with billId", async () => {
      const csv = `date,timekeeperName,hours,description,billId
2025-01-15,${context.timekeeper.name},2.5,"Client meeting",${context.bill!.id}`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(1);
        expect(result.imported[0]?.billId).toBe(context.bill!.id);
      }
    });

    it("should successfully import CSV with metadata", async () => {
      const csv = `date,timekeeperName,hours,description,metadata.taskCode,metadata.phase
2025-01-15,${context.timekeeper.name},2.5,"Client meeting",REV,Discovery`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(1);
        expect(result.imported[0]?.metadata).toEqual({
          taskCode: "REV",
          phase: "Discovery",
        });
      }
    });

    it("should handle empty metadata values", async () => {
      const csv = `date,timekeeperName,hours,description,metadata.taskCode
2025-01-15,${context.timekeeper.name},2.5,"Client meeting",`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(1);
        expect(result.imported[0]?.metadata).toEqual({});
      }
    });

    it("should fail on invalid date format", async () => {
      const csv = `date,timekeeperName,hours,description
not-a-date,${context.timekeeper.name},2.5,"Client meeting"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Validation error: date");
        expect(result.row).toBe(1);
      }
    });

    it("should fail on invalid hours", async () => {
      const csv = `date,timekeeperName,hours,description
2025-01-15,${context.timekeeper.name},-2.5,"Client meeting"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Validation error: hours");
        expect(result.row).toBe(1);
      }
    });

    it("should fail on missing required columns", async () => {
      const csv = `date,hours,description
2025-01-15,2.5,"Client meeting"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Missing timekeeper name");
      }
    });

    it("should fail on empty CSV", async () => {
      const csv = ``;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("empty");
      }
    });

    it("should fail on CSV with only headers", async () => {
      const csv = `date,timekeeperName,hours,description`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("No data rows");
      }
    });

    it("should skip empty rows", async () => {
      const csv = `date,timekeeperName,hours,description
2025-01-15,${context.timekeeper.name},2.5,"Client meeting"

2025-01-16,${context.timekeeper.name},1.0,"Legal research"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(2);
      }
    });

    it("should fail on invalid bill ID", async () => {
      const csv = `date,timekeeperName,hours,description,billId
2025-01-15,${context.timekeeper.name},2.5,"Client meeting",invalid-bill-id`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("billId");
        expect(result.row).toBe(1);
      }
    });

    it("should import multiple entries for the same timekeeper", async () => {
      const csv = `date,timekeeperName,hours,description
2025-01-15,${context.timekeeper.name},2.5,"Client meeting"
2025-01-15,${context.timekeeper.name},1.5,"Document review"
2025-01-16,${context.timekeeper.name},3.0,"Court appearance"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(3);
        expect(
          result.imported.every(
            (e: TimeEntry) => e.timekeeperId === context.timekeeper.id
          )
        ).toBe(true);
      }
    });

    it("should create multiple new timekeepers in a single import", async () => {
      const csv = `date,timekeeperName,hours,description
2025-01-15,Lawyer A,2.5,"Client meeting"
2025-01-15,Lawyer B,1.5,"Document review"
2025-01-16,Lawyer A,3.0,"Court appearance"`;

      const result = await service.importTimeEntries(context.matter.id, csv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.count).toBe(3);

        // Verify both new timekeepers were created
        const { getRepos } = await import("@ai-starter/db");
        const repos = getRepos(db);
        const timekeepers = await repos.timekeeper.listAll();
        const lawyerA = timekeepers.find((t) => t.name === "Lawyer A");
        const lawyerB = timekeepers.find((t) => t.name === "Lawyer B");

        expect(lawyerA).toBeDefined();
        expect(lawyerB).toBeDefined();

        // Verify both got timekeeper roles
        const timekeeperRoles = await repos.timekeeperRole.listByMatter(
          context.matter.id
        );
        expect(
          timekeeperRoles.some((tr) => tr.timekeeperId === lawyerA!.id)
        ).toBe(true);
        expect(
          timekeeperRoles.some((tr) => tr.timekeeperId === lawyerB!.id)
        ).toBe(true);
      }
    });
  });
});
