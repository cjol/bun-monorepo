import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import { setupDB } from "./utils/db";
import { doSeedRoles } from "@ai-starter/db/test-utils/seed/timekeeper";
import { getRepos } from "@ai-starter/db";
import { CoreAppService } from "@ai-starter/app";
import { processNextJob } from "../apps/worker/processor";

describe("Worker e2e", () => {
  let tmpDir: string;
  let app: ReturnType<typeof CoreAppService>;

  beforeEach(async () => {
    const { db, tmpDir: dir } = await setupDB("worker-test-");
    tmpDir = dir;

    // Seed roles required for timekeeper creation
    await doSeedRoles(db);

    const repos = getRepos(db);
    app = CoreAppService({ repos });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    "should enqueue job when time entry is created and process it via worker",
    async () => {
      // 1. Setup - Create Matter
      const matter = await app.matter.createMatter({
        clientName: "Test Client",
        matterName: "Test Matter",
        description: "Testing workflow execution via job queue",
      });

      // 2. Create Timekeeper
      const timekeeper = await app.timekeeper.createTimekeeper({
        name: "Test Lawyer",
        email: "lawyer@test.com",
      });

      // 3. Create Role
      const role = await app.role.createRole({
        name: "Associate",
        description: "Associate lawyer",
      });

      // 4. Assign timekeeper to matter with role
      await app.timekeeperRole.createTimekeeperRole({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        roleId: role.id,
        billableRate: 250.0,
      });

      // 5. Create a workflow that prefixes descriptions with "REVIEWED: "
      const workflow = await app.workflow.createWorkflow({
        matterId: matter.id,
        name: "Auto-Review Time Entries",
        instructions: `You are a time entry reviewer. When new time entries are created, you must update them to prefix their description with "REVIEWED: " (if not already prefixed). Use the updateTimeEntry function to make this change.`,
        trigger: "time_entry:batch_created",
      });

      // 6. Verify no jobs exist yet
      const jobsBefore = await app.job.listPendingJobs();
      expect(jobsBefore).toHaveLength(0);

      // 7. Create a time entry (this should enqueue a job)
      const timeEntry = await app.timeEntry.createTimeEntry({
        matterId: matter.id,
        timekeeperId: timekeeper.id,
        date: new Date("2024-01-15T10:00:00Z"),
        hours: 2.5,
        description: "Drafted motion for summary judgment",
      });

      expect(timeEntry.description).toBe("Drafted motion for summary judgment");

      // 8. Wait a moment for the async job enqueueing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 9. Verify a job was enqueued
      const jobsAfter = await app.job.listPendingJobs();
      expect(jobsAfter).toHaveLength(1);

      const job = jobsAfter[0];
      expect(job).toBeDefined();
      expect(job?.type).toBe("agent");
      expect(job?.status).toBe("pending");

      // Verify job parameters
      const params = job?.parameters as {
        prompt: string;
        matterId: string;
        workflowId: string;
      };
      expect(params.matterId).toBe(matter.id);
      expect(params.workflowId).toBe(workflow.id);
      expect(params.prompt).toContain(timeEntry.id);
      expect(params.prompt).toContain("Drafted motion for summary judgment");

      // 10. Process the job using the worker
      const processed = await processNextJob({ app });
      expect(processed).toBe(true);

      // 11. Verify the job is now completed
      const completedJob = await app.job.getJob(job!.id);
      expect(completedJob?.status).toBe("completed");
      expect(completedJob?.result).toBeDefined();
      expect(completedJob?.startedAt).toBeInstanceOf(Date);
      expect(completedJob?.finishedAt).toBeInstanceOf(Date);

      // 12. Verify the time entry has been updated with "REVIEWED: " prefix
      const updatedTimeEntry = await app.timeEntry.getTimeEntry(timeEntry.id);
      expect(updatedTimeEntry?.description).toBe(
        "REVIEWED: Drafted motion for summary judgment"
      );

      // 13. Verify no more pending jobs
      const finalJobs = await app.job.listPendingJobs();
      expect(finalJobs).toHaveLength(0);
    },
    { timeout: 30000 }
  ); // 30 second timeout for AI agent execution

  it("should handle job failure gracefully when workflow is deleted", async () => {
    // 1. Setup - Create Matter, Timekeeper, Role, and assign
    const matter = await app.matter.createMatter({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: "Testing job failure handling",
    });

    const timekeeper = await app.timekeeper.createTimekeeper({
      name: "Test Lawyer",
      email: "lawyer2@test.com",
    });

    const role = await app.role.createRole({
      name: "Senior Associate",
      description: "Senior associate lawyer",
    });

    await app.timekeeperRole.createTimekeeperRole({
      matterId: matter.id,
      timekeeperId: timekeeper.id,
      roleId: role.id,
      billableRate: 350.0,
    });

    // 2. Create a workflow
    const workflow = await app.workflow.createWorkflow({
      matterId: matter.id,
      name: "Test Workflow",
      instructions: "Process time entries",
      trigger: "time_entry:batch_created",
    });

    // 3. Create a time entry (enqueues a job)
    await app.timeEntry.createTimeEntry({
      matterId: matter.id,
      timekeeperId: timekeeper.id,
      date: new Date("2024-01-15T10:00:00Z"),
      hours: 1.0,
      description: "Test entry",
    });

    // Wait for async job enqueueing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 4. Delete the workflow before processing the job
    await app.workflow.deleteWorkflow(workflow.id);

    // 5. Get the pending job
    const jobs = await app.job.listPendingJobs();
    expect(jobs).toHaveLength(1);
    const job = jobs[0];

    // 6. Process the job (should fail due to missing workflow)
    const processed = await processNextJob({ app });
    expect(processed).toBe(true); // Job was processed (even though it failed)

    // 7. Verify the job failed
    const failedJob = await app.job.getJob(job!.id);
    expect(failedJob?.status).toBe("failed");
    expect(failedJob?.result).toBeDefined();

    const errorResult = failedJob?.result as { error?: string };
    expect(errorResult.error).toContain("not found");
  });

  it("should return false when no pending jobs exist", async () => {
    // Try to process a job when queue is empty
    const processed = await processNextJob({ app });
    expect(processed).toBe(false);
  });
});
