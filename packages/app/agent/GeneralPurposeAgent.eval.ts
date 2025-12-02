import { evalite } from "evalite";
import { anthropic } from "@ai-sdk/anthropic";
import { wrapAISDKModel } from "evalite/ai-sdk";
import { Experimental_Agent as Agent, type ToolSet } from "ai";
import {
  testDB,
  doSeedRoles,
  createTestTimekeeper,
} from "@ai-starter/db/test-utils";
import { getRepos } from "@ai-starter/db";
import {
  MatterService,
  BillService,
  TimeEntryService,
  AiSuggestionService,
  WorkflowService,
  TimekeeperService,
  TimekeeperRoleService,
} from "../core";
import { createGeneralPurposeAgent } from "./GeneralPurposeAgent";
import type { TimeEntry } from "@ai-starter/core";

/**
 * Shared setup function to create database, repos, and services for each test
 */
async function setupTest() {
  const db = await testDB({ seed: false });
  const repos = getRepos(db);
  await doSeedRoles(db);
  const timeEntry = TimeEntryService({ repos });
  const services = {
    matter: MatterService({ repos }),
    bill: BillService({ repos }),
    timeEntry,
    aiSuggestion: AiSuggestionService({ repos, services: { timeEntry } }),
    workflow: WorkflowService({ repos }),
    timekeeper: TimekeeperService({ repos }),
    timekeeperRole: TimekeeperRoleService({ repos }),
  };
  const model = wrapAISDKModel(anthropic("claude-haiku-4-5"));
  return { db, repos, services, model };
}

/**
 * Helper to consume agent stream and return text response
 */
async function runAgent<T extends ToolSet>(agent: Agent<T>, prompt: string) {
  const result = await agent.generate({
    messages: [{ role: "user", content: prompt }],
  });
  return result;
}

evalite("Create Matter", {
  data: [
    {
      input: {
        clientName: "Acme Corp",
        matterName: "Patent Litigation",
        description: "Patent infringement case",
      },
      expected: {
        clientName: "Acme Corp",
        matterName: "Patent Litigation",
        description: "Patent infringement case",
      },
    },
  ],
  task: async (input) => {
    const { repos, services, model } = await setupTest();
    const agent = createGeneralPurposeAgent({ services, model });

    await runAgent(
      agent,
      `Create a new matter for ${input.clientName} with the name '${input.matterName}' and description '${input.description}'`
    );

    // Verify the matter was created
    const allMatters = await repos.matter.listAll();
    if (allMatters.length !== 1) {
      throw new Error(`Expected 1 matter, got ${allMatters.length}`);
    }
    return allMatters[0];
  },
  scorers: [
    {
      name: "Matter Created Correctly",
      scorer: ({ output, expected }) => {
        if (!output) return 0;
        const clientMatch = output.clientName === expected.clientName;
        const matterMatch = output.matterName === expected.matterName;
        const descMatch = output.description === expected.description;
        return clientMatch && matterMatch && descMatch ? 1 : 0;
      },
    },
  ],
});

evalite("Create Time Entries", {
  data: [
    {
      input: {
        entries: [
          {
            date: "2025-01-15",
            hours: 3,
            description: "Reviewed contract terms",
          },
          { date: "2025-01-16", hours: 2.5, description: "Drafted amendments" },
        ],
      },
    },
  ],
  task: async (input) => {
    const { db, model, services } = await setupTest();

    // Setup: create matter and timekeeper
    const matter = await services.matter.createMatter({
      clientName: "Test Corp",
      matterName: "Contract Review",
      description: null,
    });

    const timekeeper = await createTestTimekeeper(db);
    if (!timekeeper) {
      throw new Error("Failed to create timekeeper");
    }

    const agent = createGeneralPurposeAgent({ services, model });

    // Ask agent to create time entries
    const result = await runAgent(
      agent,
      `Create two time entries for matter ${matter.id} with timekeeper ${timekeeper.id}:
      ${input.entries.map((e) => `- On ${e.date}, ${e.hours} hours for "${e.description}"`).join("\n")}`
    );

    // Return created entries
    const entries = await services.timeEntry.listByMatter(matter.id);
    return {
      entries: entries.sort((a, b) => a.date.getTime() - b.date.getTime()),
      logs: result,
    };
  },
  scorers: [
    {
      name: "Correct Number of Entries",
      scorer: ({ output, input }) => {
        const matchingEntries = input.entries.filter((inputEntry) =>
          output.entries.some(
            (outputEntry) =>
              outputEntry.hours === inputEntry.hours &&
              outputEntry.description === inputEntry.description &&
              outputEntry.date.toISOString().startsWith(inputEntry.date)
          )
        );
        return matchingEntries.length / input.entries.length;
      },
    },
  ],
});

evalite("Calculation Request", {
  data: [
    {
      input: {
        entries: [
          { hours: 5, description: "Initial consultation" },
          { hours: 3.5, description: "Research" },
          { hours: 2.5, description: "Report writing" },
        ],
      },
      expected: { totalHours: 11 },
    },
  ],
  task: async (input) => {
    const { db, model, services } = await setupTest();

    // Setup: create matter with time entries
    const matter = await services.matter.createMatter({
      clientName: "Test Corp",
      matterName: "Tax Advisory",
      description: null,
    });

    const timekeeper = await createTestTimekeeper(db);
    if (!timekeeper) {
      throw new Error("Failed to create timekeeper");
    }

    // Create the time entries
    for (const entry of input.entries) {
      await services.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        billId: null,
        date: new Date("2025-01-01"),
        hours: entry.hours,
        description: entry.description,
      });
    }

    const agent = createGeneralPurposeAgent({ services, model });

    // Ask agent to calculate total hours
    const { text } = await runAgent(
      agent,
      `What is the total number of hours recorded for matter ${matter.id}?`
    );

    return { responseText: text };
  },
  scorers: [
    {
      name: "Response Contains Correct Total",
      scorer: ({ output, expected }) => {
        return output.responseText.includes(expected.totalHours.toString())
          ? 1
          : 0;
      },
    },
  ],
});

evalite("Review Workflow", {
  data: [
    {
      input: {
        workflowInstructions:
          'All time entries with 6 hours or more must have their description prefixed with "SIMPLIFY: " to remind the timekeeper to break them down into smaller tasks.',
        entries: [
          { hours: 8, description: "Drafted comprehensive legal brief" },
          { hours: 3, description: "Client phone call" },
          { hours: 6, description: "Research case law" },
          { hours: 2.5, description: "Team meeting" },
        ],
      },
    },
  ],
  task: async (input) => {
    const { db, model, services } = await setupTest();

    // Setup
    const matter = await services.matter.createMatter({
      clientName: "Test Corp",
      matterName: "Large Project",
      description: null,
    });

    const timekeeper = await createTestTimekeeper(db);
    if (!timekeeper) {
      throw new Error("Failed to create timekeeper");
    }

    const workflow = await services.workflow.createWorkflow({
      matterId: matter.id,
      name: "Timesheet Review Policy",
      instructions: input.workflowInstructions,
    });

    // Create time entries
    const entries: TimeEntry[] = [];
    for (const entry of input.entries) {
      entries.push(
        await services.timeEntry.createTimeEntry({
          matterId: matter.id,
          timekeeperId: timekeeper.id,
          billId: null,
          date: new Date("2025-01-10"),
          hours: entry.hours,
          description: entry.description,
        })
      );
    }

    const agent = createGeneralPurposeAgent({
      services,
      model,
      workflowInstructions: workflow.instructions,
    });

    // Ask agent to review
    const result = await runAgent(
      agent,
      `Please review all time entries for matter ${matter.id} and create AI suggestions for any entries that don't comply with the workflow policy. Make sure to follow the workflow instructions carefully.`
    );

    const suggestions = await services.aiSuggestion.listByMatter(matter.id);

    return { suggestions, entries, logs: result };
  },
  scorers: [
    {
      name: "True Negatives (No Suggestion for < 6 hours)",
      scorer: ({ output: { entries, suggestions } }) => {
        const entriesUnder6 = entries.filter((e) => e.hours < 6);
        if (entriesUnder6.length === 0) return 1;

        const correctNegatives = entriesUnder6.filter(
          (entry) =>
            suggestions.find((s) => s.timeEntryId === entry.id) === undefined
        );

        return correctNegatives.length / entriesUnder6.length;
      },
    },
    {
      name: "True Positives (Suggestion for >= 6 hours)",
      scorer: ({ output: { entries, suggestions } }) => {
        const entries6OrMore = entries.filter((e) => e.hours >= 6);
        if (entries6OrMore.length === 0) return 1;

        const correctPositives = entries6OrMore.filter(
          (entry) =>
            suggestions.find((s) => s.timeEntryId === entry.id) !== undefined
        );

        return correctPositives.length / entries6OrMore.length;
      },
    },
    {
      name: "SIMPLIFY Prefix Applied",
      scorer: ({ output: { suggestions } }) => {
        if (suggestions.length === 0) return 0;

        const withPrefix = suggestions.filter((s) =>
          s.suggestedChanges.description?.startsWith("SIMPLIFY: ")
        );

        return withPrefix.length / suggestions.length;
      },
    },
  ],
});
