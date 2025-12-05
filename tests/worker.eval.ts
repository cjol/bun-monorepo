import { evalite } from "evalite";
import {
  testDB,
  createTimeTrackingTestContext,
} from "@ai-starter/db/test-utils";
import { getRepos, MockFileStorage } from "@ai-starter/db";
import { CoreAppService } from "@ai-starter/app";
import { processNextJob } from "../apps/worker/processor";
import { wrapAISDKModel } from "evalite/ai-sdk";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Shared setup function to create database, repos, and app for each test
 */
async function setupTest() {
  const db = await testDB({ seed: false });
  const repos = getRepos(db);
  const storage = MockFileStorage();
  const app = CoreAppService({ repos, storage });
  const context = await createTimeTrackingTestContext(db, { seedRoles: true });
  const model = wrapAISDKModel(anthropic("claude-haiku-4-5"));
  return { app, context, model };
}

evalite("Worker processes time entry review workflow", {
  data: [
    {
      input: {
        workflowName: "Auto-Review Time Entries",
        workflowInstructions: `When new time entries are created, you must update them to prefix their description with "REVIEWED: " (if not already prefixed).`,
        workflowTrigger: "time_entry:batch_created",
        timeEntryDate: "2024-01-15T10:00:00Z",
        timeEntryHours: 2.5,
        timeEntryDescription: "Drafted motion for summary judgment",
      },
      expected: {
        originalDescription: "Drafted motion for summary judgment",
        suggestedDescription: "REVIEWED: Drafted motion for summary judgment",
      },
    },
  ],
  task: async (input) => {
    const { app, context, model } = await setupTest();
    const { matter, timekeeper } = context;

    // 1. Create workflow
    await app.workflow.createWorkflow({
      matterId: matter.id,
      name: input.workflowName,
      instructions: input.workflowInstructions,
      trigger: input.workflowTrigger,
    });

    // 2. Create a time entry (this should enqueue a job)
    const timeEntries = await app.timeEntry.createTimeEntries(matter.id, [
      {
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        date: new Date(input.timeEntryDate),
        hours: input.timeEntryHours,
        description: input.timeEntryDescription,
      },
    ]);
    const timeEntry = timeEntries[0];
    if (!timeEntry) {
      throw new Error("Failed to create time entry");
    }
    const originalDescription = timeEntry.description;

    // 3. Verify a job was enqueued
    const jobsAfter = await app.job.listPendingJobs();
    if (jobsAfter.length !== 1) {
      throw new Error(`Expected 1 pending job, got ${jobsAfter.length}`);
    }

    const job = jobsAfter[0];
    if (!job) {
      throw new Error("Job is undefined");
    }

    // 4. Process job using worker
    const processed = await processNextJob({
      app,
      model,
    });
    if (!processed) {
      throw new Error("Job was not processed");
    }

    // 5. Verify time entry was NOT directly modified
    const unchangedTimeEntry = await app.timeEntry.getTimeEntry(timeEntry.id);
    if (!unchangedTimeEntry) {
      throw new Error("Time entry not found");
    }

    // 6. Check that AI suggestion was created
    const suggestions = await app.aiSuggestion.listByStatus(
      matter.id,
      "pending"
    );
    if (suggestions.length !== 1) {
      throw new Error(
        `Expected 1 pending suggestion, got ${suggestions.length}`
      );
    }

    const suggestion = suggestions[0];
    if (!suggestion) {
      throw new Error("Suggestion is undefined");
    }

    // 7. Get completed job
    const completedJob = await app.job.getJob(job.id);

    return {
      originalDescription,
      unchangedDescription: unchangedTimeEntry.description,
      suggestedDescription: suggestion.suggestedChanges.description,
      suggestionStatus: suggestion.status,
      jobStatus: completedJob?.status,
      jobStartedAt: completedJob?.startedAt,
      jobFinishedAt: completedJob?.finishedAt,
      result: completedJob?.result,
    };
  },
  scorers: [
    {
      name: "Time entry unchanged",
      scorer: ({ output, expected }) => {
        return output.unchangedDescription === expected.originalDescription
          ? 1
          : 0;
      },
    },
    {
      name: "AI suggestion created with correct description",
      scorer: ({ output, expected }) => {
        return output.suggestedDescription === expected.suggestedDescription
          ? 1
          : 0;
      },
    },
  ],
});
