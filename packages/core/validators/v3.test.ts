import { describe, expect, test } from "bun:test";
import {
  matterValidator,
  billValidator,
  billStatusValidator,
  timeEntryValidator,
  timeEntryChangeLogValidator,
  aiSuggestionValidator,
  aiSuggestionStatusValidator,
  workflowValidator,
} from "./index";

describe("V3 Validators", () => {
  describe("matterValidator", () => {
    test("validates valid matter", () => {
      const validMatter = {
        id: crypto.randomUUID(),
        clientName: "Test Client",
        matterName: "Test Matter",
        description: "Test description",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => matterValidator.parse(validMatter)).not.toThrow();
    });

    test("validates matter with null description", () => {
      const validMatter = {
        id: crypto.randomUUID(),
        clientName: "Test Client",
        matterName: "Test Matter",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => matterValidator.parse(validMatter)).not.toThrow();
    });

    test("rejects invalid UUID", () => {
      const invalidMatter = {
        id: "not-a-uuid",
        clientName: "Test Client",
        matterName: "Test Matter",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => matterValidator.parse(invalidMatter)).toThrow();
    });

    test("rejects empty clientName", () => {
      const invalidMatter = {
        id: crypto.randomUUID(),
        clientName: "",
        matterName: "Test Matter",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => matterValidator.parse(invalidMatter)).toThrow();
    });
  });

  describe("billValidator", () => {
    test("validates valid bill", () => {
      const validBill = {
        id: crypto.randomUUID(),
        matterId: crypto.randomUUID(),
        periodStart: new Date("2025-01-01"),
        periodEnd: new Date("2025-01-31"),
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => billValidator.parse(validBill)).not.toThrow();
    });

    test("validates all status values", () => {
      const statuses = ["draft", "finalized", "sent", "paid"] as const;
      for (const status of statuses) {
        expect(() => billStatusValidator.parse(status)).not.toThrow();
      }
    });

    test("rejects invalid status", () => {
      expect(() => billStatusValidator.parse("invalid")).toThrow();
    });
  });

  describe("timeEntryValidator", () => {
    test("validates valid time entry", () => {
      const validEntry = {
        id: crypto.randomUUID(),
        matterId: crypto.randomUUID(),
        billId: null,
        date: new Date(),
        hours: 8.5,
        description: "Worked on project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => timeEntryValidator.parse(validEntry)).not.toThrow();
    });

    test("rejects negative hours", () => {
      const invalidEntry = {
        id: crypto.randomUUID(),
        matterId: crypto.randomUUID(),
        billId: null,
        date: new Date(),
        hours: -1,
        description: "Worked on project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => timeEntryValidator.parse(invalidEntry)).toThrow();
    });

    test("rejects hours > 24", () => {
      const invalidEntry = {
        id: crypto.randomUUID(),
        matterId: crypto.randomUUID(),
        billId: null,
        date: new Date(),
        hours: 25,
        description: "Worked on project",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => timeEntryValidator.parse(invalidEntry)).toThrow();
    });
  });

  describe("timeEntryChangeLogValidator", () => {
    test("validates valid change log", () => {
      const validLog = {
        id: crypto.randomUUID(),
        timeEntryId: crypto.randomUUID(),
        beforeData: { hours: 8 },
        afterData: { hours: 9 },
        changedAt: new Date(),
      };
      expect(() => timeEntryChangeLogValidator.parse(validLog)).not.toThrow();
    });

    test("validates change log with null beforeData", () => {
      const validLog = {
        id: crypto.randomUUID(),
        timeEntryId: crypto.randomUUID(),
        beforeData: null,
        afterData: { hours: 9 },
        changedAt: new Date(),
      };
      expect(() => timeEntryChangeLogValidator.parse(validLog)).not.toThrow();
    });
  });

  describe("aiSuggestionValidator", () => {
    test("validates valid suggestion", () => {
      const validSuggestion = {
        id: crypto.randomUUID(),
        timeEntryId: crypto.randomUUID(),
        messageId: crypto.randomUUID(),
        suggestedChanges: { hours: 10 },
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => aiSuggestionValidator.parse(validSuggestion)).not.toThrow();
    });

    test("validates all status values", () => {
      const statuses = ["pending", "approved", "rejected"] as const;
      for (const status of statuses) {
        expect(() => aiSuggestionStatusValidator.parse(status)).not.toThrow();
      }
    });

    test("rejects invalid status", () => {
      expect(() => aiSuggestionStatusValidator.parse("invalid")).toThrow();
    });
  });

  describe("workflowValidator", () => {
    test("validates valid workflow", () => {
      const validWorkflow = {
        id: crypto.randomUUID(),
        name: "Test Workflow",
        instructions: "Do something useful",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => workflowValidator.parse(validWorkflow)).not.toThrow();
    });

    test("rejects empty name", () => {
      const invalidWorkflow = {
        id: crypto.randomUUID(),
        name: "",
        instructions: "Do something useful",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => workflowValidator.parse(invalidWorkflow)).toThrow();
    });

    test("rejects empty instructions", () => {
      const invalidWorkflow = {
        id: crypto.randomUUID(),
        name: "Test Workflow",
        instructions: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => workflowValidator.parse(invalidWorkflow)).toThrow();
    });
  });
});
