import { evalite } from "evalite";
import {
  testDB,
  createTimeTrackingTestContext,
} from "@ai-starter/db/test-utils";
import { getRepos } from "@ai-starter/db";
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
  const app = CoreAppService({ repos });
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
        updatedDescription: "REVIEWED: Drafted motion for summary judgment",
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

    // 5. Process the job using the worker
    const processed = await processNextJob({
      app,
      model,
    });
    if (!processed) {
      throw new Error("Job was not processed");
    }

    // 6. Get the updated time entry
    const updatedTimeEntry = await app.timeEntry.getTimeEntry(timeEntry.id);
    console.log(timeEntry, updatedTimeEntry);
    if (!updatedTimeEntry) {
      throw new Error("Updated time entry not found");
    }

    // 7. Get the completed job
    const completedJob = await app.job.getJob(job.id);

    return {
      originalDescription,
      updatedDescription: updatedTimeEntry.description,
      jobStatus: completedJob?.status,
      jobStartedAt: completedJob?.startedAt,
      jobFinishedAt: completedJob?.finishedAt,
      result: completedJob?.result,
    };
  },
  scorers: [
    {
      name: "Description Updated with REVIEWED prefix",
      scorer: ({ output, expected }) => {
        return output.updatedDescription === expected.updatedDescription
          ? 1
          : 0;
      },
    },
  ],
});
