import { describe, test, expect, beforeEach } from "bun:test";
import { createGeneralPurposeAgent } from "./GeneralPurposeAgent";
import {
  testDB,
  doSeedRoles,
  createTestTimekeeper,
} from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import {
  MatterService,
  BillService,
  TimeEntryService,
  AiSuggestionService,
  WorkflowService,
  TimekeeperService,
  TimekeeperRoleService,
} from "../core";

/**
 * Integration tests for GeneralPurposeAgent.
 *
 * These tests invoke the agent with natural language prompts and verify
 * that it correctly performs the requested actions by checking the actual
 * database state after execution.
 *
 * NOTE: These tests make real API calls to Anthropic Claude and require
 * valid API credentials with sufficient credits.
 */
describe("GeneralPurposeAgent integration tests", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let services: {
    matter: ReturnType<typeof MatterService>;
    bill: ReturnType<typeof BillService>;
    timeEntry: ReturnType<typeof TimeEntryService>;
    aiSuggestion: ReturnType<typeof AiSuggestionService>;
    workflow: ReturnType<typeof WorkflowService>;
    timekeeper: ReturnType<typeof TimekeeperService>;
    timekeeperRole: ReturnType<typeof TimekeeperRoleService>;
  };

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repos = getRepos(db);
    await doSeedRoles(db);
    const timeEntry = TimeEntryService({ repos });
    services = {
      matter: MatterService({ repos }),
      bill: BillService({ repos }),
      timeEntry,
      aiSuggestion: AiSuggestionService({ repos, services: { timeEntry } }),
      workflow: WorkflowService({ repos }),
      timekeeper: TimekeeperService({ repos }),
      timekeeperRole: TimekeeperRoleService({ repos }),
    };
  });

  test(
    "should create a new matter when requested",
    async () => {
      const agent = createGeneralPurposeAgent({ services });

      // Ask the agent to create a new matter
      const result = agent.stream({
        messages: [
          {
            role: "user",
            content:
              "Create a new matter for Acme Corp with the name 'Patent Litigation' and description 'Patent infringement case'",
          },
        ],
      });

      // Wait for the agent to complete
      for await (const _chunk of result.fullStream) {
        // Consume all chunks
      }

      // Verify the matter was actually created in the database
      const allMatters = await repos.matter.listAll();
      expect(allMatters.length).toBe(1);
      expect(allMatters[0]?.clientName).toBe("Acme Corp");
      expect(allMatters[0]?.matterName).toBe("Patent Litigation");
      expect(allMatters[0]?.description).toBe("Patent infringement case");
    },
    { timeout: 30000 }
  );

  test(
    "should create time entries when requested",
    async () => {
      // Setup: create a matter and timekeeper first
      const matter = await services.matter.createMatter({
        clientName: "Test Corp",
        matterName: "Contract Review",
        description: null,
      });

      const timekeeper = await createTestTimekeeper(db, matter.id);
      if (!timekeeper) {
        throw new Error("Failed to create timekeeper");
      }

      const agent = createGeneralPurposeAgent({ services });

      // Ask the agent to create time entries
      const result = agent.stream({
        messages: [
          {
            role: "user",
            content: `Create two time entries for matter ${matter.id} with timekeeper ${timekeeper.id}:
            1. On 2025-01-15, 3 hours for "Reviewed contract terms"
            2. On 2025-01-16, 2.5 hours for "Drafted amendments"`,
          },
        ],
      });

      // Wait for completion
      for await (const _chunk of result.fullStream) {
        // Consume all chunks
      }

      // Verify the time entries were created
      const entries = await services.timeEntry.listByMatter(matter.id);
      expect(entries.length).toBe(2);

      // Sort by date to ensure consistent ordering
      entries.sort((a, b) => a.date.getTime() - b.date.getTime());

      expect(entries[0]?.hours).toBe(3);
      expect(entries[0]?.description).toContain("contract terms");
      expect(entries[1]?.hours).toBe(2.5);
      expect(entries[1]?.description).toContain("amendments");
    },
    { timeout: 30000 }
  );

  test(
    "should calculate total hours for a matter",
    async () => {
      // Setup: create matter with time entries
      const matter = await services.matter.createMatter({
        clientName: "Test Corp",
        matterName: "Tax Advisory",
        description: null,
      });

      const timekeeper = await createTestTimekeeper(db, matter.id);
      if (!timekeeper) {
        throw new Error("Failed to create timekeeper");
      }

      await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-01"),
        hours: 5,
        description: "Initial consultation",
      });

      await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-02"),
        hours: 3.5,
        description: "Research",
      });

      await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-03"),
        hours: 2.5,
        description: "Report writing",
      });

      const agent = createGeneralPurposeAgent({ services });

      // Ask the agent to calculate total hours
      const result = agent.stream({
        messages: [
          {
            role: "user",
            content: `What is the total number of hours recorded for matter ${matter.id}?`,
          },
        ],
      });

      // Collect the response text
      let responseText = "";
      for await (const chunk of result.fullStream) {
        if (chunk.type === "text-delta") {
          responseText += chunk.text;
        }
      }

      // The agent should mention the correct total (11 hours)
      expect(responseText).toMatch(/11/);
    },
    { timeout: 30000 }
  );

  test(
    "should create AI suggestions for time entries",
    async () => {
      // Setup: create matter and time entry
      const matter = await services.matter.createMatter({
        clientName: "Test Corp",
        matterName: "Merger Advisory",
        description: null,
      });

      const timekeeper = await createTestTimekeeper(db, matter.id);
      if (!timekeeper) {
        throw new Error("Failed to create timekeeper");
      }

      const timeEntry = await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-01"),
        hours: 2,
        description: "Meeting with client",
      });

      const agent = createGeneralPurposeAgent({ services });

      // Ask the agent to create a suggestion
      const result = agent.stream({
        messages: [
          {
            role: "user",
            content: `Create an AI suggestion for time entry ${timeEntry.id} that changes the description to "Initial client meeting - M&A discussion" and increases hours to 2.5`,
          },
        ],
      });

      // Wait for completion
      for await (const _chunk of result.fullStream) {
        // Consume all chunks
      }

      // Verify the suggestion was created
      const suggestions = await services.aiSuggestion.listByTimeEntry(
        timeEntry.id
      );
      expect(suggestions.length).toBe(1);
      expect(suggestions[0]?.status).toBe("pending");
      expect(suggestions[0]?.suggestedChanges.hours).toBe(2.5);
      expect(suggestions[0]?.suggestedChanges.description).toContain("M&A");
    },
    { timeout: 30000 }
  );

  test(
    "should respect workflow instructions",
    async () => {
      const workflowInstructions =
        "When creating time entries, always round hours up to the nearest 0.5";

      const matter = await services.matter.createMatter({
        clientName: "Test Corp",
        matterName: "General Advisory",
        description: null,
      });

      const timekeeper = await createTestTimekeeper(db, matter.id);
      if (!timekeeper) {
        throw new Error("Failed to create timekeeper");
      }

      const agent = createGeneralPurposeAgent({
        services,
        workflowInstructions,
      });

      // Ask the agent to create a time entry with an odd number like 2.3 hours
      const result = agent.stream({
        messages: [
          {
            role: "user",
            content: `Create a time entry for matter ${matter.id} with timekeeper ${timekeeper.id}, on 2025-01-15, for 2.3 hours, description "Legal research"`,
          },
        ],
      });

      // Wait for completion
      for await (const _chunk of result.fullStream) {
        // Consume all chunks
      }

      // Verify the time entry was created with rounded hours (should be 2.5)
      const entries = await services.timeEntry.listByMatter(matter.id);
      expect(entries.length).toBe(1);
      // The agent should have rounded 2.3 to 2.5
      expect(entries[0]?.hours).toBe(2.5);
    },
    { timeout: 30000 }
  );

  test(
    "should automatically inject workflow instructions when reviewing timesheets",
    async () => {
      // Setup: create matter and timekeeper
      const matter = await services.matter.createMatter({
        clientName: "Test Corp",
        matterName: "Large Project",
        description: null,
      });

      const timekeeper = await createTestTimekeeper(db, matter.id);
      if (!timekeeper) {
        throw new Error("Failed to create timekeeper");
      }

      // Create a workflow with specific instruction about long entries
      const workflow = await services.workflow.createWorkflow({
        matterId: matter.id,
        name: "Timesheet Review Policy",
        instructions:
          'All time entries with 6 hours or more must have their description prefixed with "SIMPLIFY: " to remind the timekeeper to break them down into smaller tasks.',
      });

      // Create several time entries with varying hours
      const entry1 = await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-10"),
        hours: 8,
        description: "Drafted comprehensive legal brief",
      });

      const entry2 = await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-11"),
        hours: 3,
        description: "Client phone call",
      });

      const entry3 = await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-12"),
        hours: 6,
        description: "Research case law",
      });

      const entry4 = await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-13"),
        hours: 2.5,
        description: "Team meeting",
      });

      // Create agent with workflow instructions injected
      const agent = createGeneralPurposeAgent({
        services,
        workflowInstructions: workflow.instructions,
      });

      // Ask the agent to review timesheets for compliance
      const result = agent.stream({
        messages: [
          {
            role: "user",
            content: `Please review all time entries for matter ${matter.id} and create AI suggestions for any entries that don't comply with the workflow policy. Make sure to follow the workflow instructions carefully.`,
          },
        ],
      });

      // Collect response for debugging if needed
      let responseText = "";
      for await (const chunk of result.fullStream) {
        if (chunk.type === "text-delta") {
          responseText += chunk.text;
        }
      }

      // Verify that suggestions were created for entries >= 6 hours
      const suggestions1 = await services.aiSuggestion.listByTimeEntry(
        entry1.id
      );
      const suggestions2 = await services.aiSuggestion.listByTimeEntry(
        entry2.id
      );
      const suggestions3 = await services.aiSuggestion.listByTimeEntry(
        entry3.id
      );
      const suggestions4 = await services.aiSuggestion.listByTimeEntry(
        entry4.id
      );

      // Debug output if test fails
      if (
        suggestions1.length === 0 ||
        suggestions3.length === 0 ||
        suggestions2.length > 0 ||
        suggestions4.length > 0
      ) {
        console.log("Agent response:", responseText);
        console.log("Entry 1 (8h) suggestions:", suggestions1);
        console.log("Entry 2 (3h) suggestions:", suggestions2);
        console.log("Entry 3 (6h) suggestions:", suggestions3);
        console.log("Entry 4 (2.5h) suggestions:", suggestions4);
      }

      // Entry 1 (8 hours) should have a suggestion
      expect(suggestions1.length).toBe(1);
      expect(suggestions1[0]?.suggestedChanges.description).toContain(
        "SIMPLIFY:"
      );

      // Entry 2 (3 hours) should NOT have a suggestion
      expect(suggestions2.length).toBe(0);

      // Entry 3 (6 hours) should have a suggestion (>= 6)
      expect(suggestions3.length).toBe(1);
      expect(suggestions3[0]?.suggestedChanges.description).toContain(
        "SIMPLIFY:"
      );

      // Entry 4 (2.5 hours) should NOT have a suggestion
      expect(suggestions4.length).toBe(0);
    },
    { timeout: 30000 }
  );
});
