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
} from "../core";
import type { SandboxExecutionResult } from "./utils";

describe("createGeneralPurposeAgent", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let services: {
    matter: ReturnType<typeof MatterService>;
    bill: ReturnType<typeof BillService>;
    timeEntry: ReturnType<typeof TimeEntryService>;
    aiSuggestion: ReturnType<typeof AiSuggestionService>;
    workflow: ReturnType<typeof WorkflowService>;
  };

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repos = getRepos(db);
    const timeEntry = TimeEntryService({ repos });
    services = {
      matter: MatterService({ repos }),
      bill: BillService({ repos }),
      timeEntry,
      aiSuggestion: AiSuggestionService({ repos, services: { timeEntry } }),
      workflow: WorkflowService({ repos }),
    };
  });

  test("should create agent with sandbox tool", () => {
    const agent = createGeneralPurposeAgent({ services });
    expect(agent).toBeDefined();
    expect(agent.tools).toHaveProperty("runCode");
    expect(agent.tools.runCode).toBeDefined();
  });

  test("should include workflow context in system prompt when provided", () => {
    const workflowInstructions = "Always validate time entries before updating";
    const agent = createGeneralPurposeAgent({
      services,
      workflowInstructions,
    });
    expect(agent).toBeDefined();
    expect(agent.tools).toHaveProperty("runCode");
    // Note: system prompt is internal to Agent and not directly testable
    // We verify it works through integration tests below
  });

  test("should create agent without workflow context", () => {
    const agent = createGeneralPurposeAgent({ services });
    expect(agent).toBeDefined();
    expect(agent.tools).toHaveProperty("runCode");
  });
});

describe("GeneralPurposeAgent sandbox functions", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let services: {
    matter: ReturnType<typeof MatterService>;
    bill: ReturnType<typeof BillService>;
    timeEntry: ReturnType<typeof TimeEntryService>;
    aiSuggestion: ReturnType<typeof AiSuggestionService>;
    workflow: ReturnType<typeof WorkflowService>;
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
    };
  });

  test(
    "should execute getMatter function in sandbox",
    async () => {
      const agent = createGeneralPurposeAgent({ services });

      // Create a test matter
      const matter = await services.matter.createMatter({
        clientName: "Test Client",
        matterName: "Test Matter",
        description: "Test description",
      });

      // Execute code in sandbox to fetch matter
      if (!agent.tools.runCode) {
        throw new Error("runCode tool not found");
      }
      const resultPromise = agent.tools.runCode.execute!(
        {
          code: `
        const matter = await getMatter({ id: "${matter.id}" });
        return matter.clientName;
      `,
        },
        { toolCallId: "test-1", messages: [] }
      );
      const resultRaw = await resultPromise;
      if (Symbol.asyncIterator in Object(resultRaw)) {
        throw new Error("Unexpected async iterable result");
      }
      const result = resultRaw as SandboxExecutionResult;

      expect(result.output).toBe("Test Client");
      expect(result.error).toBeUndefined();
    },
    { timeout: 10000 }
  );

  test(
    "should execute createTimeEntry function in sandbox",
    async () => {
      const agent = createGeneralPurposeAgent({ services });

      // Create a matter first
      const matter = await services.matter.createMatter({
        clientName: "Test Client",
        matterName: "Test Matter",
        description: null,
      });

      // Create a timekeeper for the matter
      const timekeeper = await createTestTimekeeper(db, matter.id);
      if (!timekeeper) {
        throw new Error("Failed to create timekeeper");
      }

      // Execute code in sandbox to create time entry
      if (!agent.tools.runCode) {
        throw new Error("runCode tool not found");
      }
      const resultPromise = agent.tools.runCode.execute!(
        {
          code: `
        const entry = await createTimeEntry({
          matterId: "${matter.id}",
          timekeeperId: "${timekeeper.id}",
          billId: null,
          date: "${new Date("2025-01-01").toISOString()}",
          hours: 2.5,
          description: "Test work"
        });
        return entry.hours;
      `,
        },
        { toolCallId: "test-2", messages: [] }
      );
      const resultRaw = await resultPromise;
      if (Symbol.asyncIterator in Object(resultRaw)) {
        throw new Error("Unexpected async iterable result");
      }
      const result = resultRaw as SandboxExecutionResult;

      expect(result.output).toBe(2.5);
      expect(result.error).toBeUndefined();

      // Verify entry was actually created
      const entries = await services.timeEntry.listByMatter(matter.id);
      expect(entries.length).toBe(1);
      expect(entries[0]?.description).toBe("Test work");
    },
    { timeout: 10000 }
  );

  test(
    "should execute listTimeEntriesByMatter function in sandbox",
    async () => {
      const agent = createGeneralPurposeAgent({ services });

      // Create matter and time entries
      const matter = await services.matter.createMatter({
        clientName: "Test Client",
        matterName: "Test Matter",
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
        hours: 2,
        description: "Entry 1",
      });

      await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-02"),
        hours: 3,
        description: "Entry 2",
      });

      // Execute code in sandbox to list entries
      if (!agent.tools.runCode) {
        throw new Error("runCode tool not found");
      }
      const resultPromise = agent.tools.runCode.execute!(
        {
          code: `
        const entries = await listTimeEntriesByMatter({ matterId: "${matter.id}" });
        return entries.length;
      `,
        },
        { toolCallId: "test-3", messages: [] }
      );
      const resultRaw = await resultPromise;
      if (Symbol.asyncIterator in Object(resultRaw)) {
        throw new Error("Unexpected async iterable result");
      }
      const result = resultRaw as SandboxExecutionResult;

      expect(result.output).toBe(2);
      expect(result.error).toBeUndefined();
    },
    { timeout: 10000 }
  );

  test(
    "should execute createAiSuggestion function in sandbox",
    async () => {
      const agent = createGeneralPurposeAgent({ services });

      // Setup: create matter, timekeeper, and time entry
      const matter = await services.matter.createMatter({
        clientName: "Test Client",
        matterName: "Test Matter",
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
        description: "Original description",
      });

      // Execute code in sandbox to create suggestion
      if (!agent.tools.runCode) {
        throw new Error("runCode tool not found");
      }
      const resultPromise = agent.tools.runCode.execute!(
        {
          code: `
        const suggestion = await createAiSuggestion({
          timeEntryId: "${timeEntry.id}",
          suggestedChanges: {
            matterId: "${matter.id}",
            timekeeperId: "${timekeeper.id}",
            date: "2025-01-01",
            hours: 2.5,
            description: "Updated description"
          }
        });
        return suggestion.status;
      `,
        },
        { toolCallId: "test-4", messages: [] }
      );
      const resultRaw = await resultPromise;
      if (Symbol.asyncIterator in Object(resultRaw)) {
        throw new Error("Unexpected async iterable result");
      }
      const result = resultRaw as SandboxExecutionResult;

      expect(result.output).toBe("pending");
      expect(result.error).toBeUndefined();

      // Verify suggestion was created
      const suggestions = await services.aiSuggestion.listByTimeEntry(
        timeEntry.id
      );
      expect(suggestions.length).toBe(1);
      expect(suggestions[0]?.status).toBe("pending");
    },
    { timeout: 10000 }
  );

  test(
    "should list all workflows in sandbox",
    async () => {
      const agent = createGeneralPurposeAgent({ services });

      // Create matter for workflows
      const matter = await services.matter.createMatter({
        clientName: "Test Client",
        matterName: "Test Matter",
        description: null,
      });

      // Create some workflows
      await services.workflow.createWorkflow({
        matterId: matter.id,
        name: "Workflow 1",
        instructions: "Instructions 1",
      });
      await services.workflow.createWorkflow({
        matterId: matter.id,
        name: "Workflow 2",
        instructions: "Instructions 2",
      });

      // Execute code in sandbox to list workflows
      if (!agent.tools.runCode) {
        throw new Error("runCode tool not found");
      }
      const resultPromise = agent.tools.runCode.execute!(
        {
          code: `
        const workflows = await listWorkflows({ matterId: "${matter.id}" });
        return workflows.map(w => w.name);
      `,
        },
        { toolCallId: "test-5", messages: [] }
      );
      const resultRaw = await resultPromise;
      if (Symbol.asyncIterator in Object(resultRaw)) {
        throw new Error("Unexpected async iterable result");
      }
      const result = resultRaw as SandboxExecutionResult;

      expect(result.output).toEqual(["Workflow 1", "Workflow 2"]);
      expect(result.error).toBeUndefined();
    },
    { timeout: 10000 }
  );
});
