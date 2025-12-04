import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleJobRepository } from "./JobRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleJobRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleJobRepository>;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleJobRepository({ db });
  });

  describe("get", () => {
    it("should return undefined when job does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create a new job with pending status", async () => {
      const job = await repository.create({
        type: "agent",
        parameters: {
          prompt: "Test prompt",
          matterId: "test-matter-id",
          workflowId: "test-workflow-id",
        },
      });

      expect(job.id).toBeDefined();
      expect(job.type).toBe("agent");
      expect(job.status).toBe("pending");
      expect(job.parameters).toEqual({
        prompt: "Test prompt",
        matterId: "test-matter-id",
        workflowId: "test-workflow-id",
      });
      expect(job.result).toBeNull();
      expect(job.scheduledAt).toBeInstanceOf(Date);
      expect(job.startedAt).toBeNull();
      expect(job.finishedAt).toBeNull();

      const result = await repository.get(job.id);
      expect(result).toEqual(job);
    });
  });

  describe("update", () => {
    it("should update a job", async () => {
      const job = await repository.create({
        type: "agent",
        parameters: { prompt: "Test" },
      });

      const updated = await repository.update(job.id, {
        status: "completed",
        result: { success: true },
        finishedAt: new Date(),
      });

      expect(updated).toMatchObject({
        id: job.id,
        status: "completed",
        result: { success: true },
        finishedAt: expect.any(Date),
      });
    });

    it("should throw notFound when job does not exist", async () => {
      expect(
        repository.update("non-existent-id", { status: "completed" })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a job", async () => {
      const job = await repository.create({
        type: "agent",
        parameters: { prompt: "Test" },
      });

      await repository.delete(job.id);
      const result = await repository.get(job.id);

      expect(result).toBeUndefined();
    });

    it("should throw notFound when job does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should return empty array when no jobs exist", async () => {
      const results = await repository.list();
      expect(results).toEqual([]);
    });

    it("should return all jobs ordered by scheduledAt", async () => {
      const job1 = await repository.create({
        type: "agent",
        parameters: { prompt: "First" },
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const job2 = await repository.create({
        type: "agent",
        parameters: { prompt: "Second" },
      });

      const results = await repository.list();

      expect(results).toHaveLength(2);
      expect(results[0]?.id).toBe(job1.id);
      expect(results[1]?.id).toBe(job2.id);
    });
  });

  describe("listPending", () => {
    it("should return empty array when no pending jobs exist", async () => {
      const results = await repository.listPending();
      expect(results).toEqual([]);
    });

    it("should return only pending jobs", async () => {
      const pendingJob = await repository.create({
        type: "agent",
        parameters: { prompt: "Pending" },
      });

      await repository.create({
        type: "agent",
        parameters: { prompt: "Running" },
        status: "running",
      });

      const results = await repository.listPending();

      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe(pendingJob.id);
      expect(results[0]?.status).toBe("pending");
    });
  });

  describe("claimNext", () => {
    it("should return undefined when no pending jobs exist", async () => {
      const result = await repository.claimNext();
      expect(result).toBeUndefined();
    });

    it("should claim the oldest pending job", async () => {
      const job1 = await repository.create({
        type: "agent",
        parameters: { prompt: "First" },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.create({
        type: "agent",
        parameters: { prompt: "Second" },
      });

      const claimed = await repository.claimNext();

      expect(claimed).toBeDefined();
      expect(claimed?.id).toBe(job1.id);
      expect(claimed?.status).toBe("running");
      expect(claimed?.startedAt).toBeInstanceOf(Date);

      // Verify it's no longer in pending list
      const pending = await repository.listPending();
      expect(pending).toHaveLength(1);
      expect(pending[0]?.id).not.toBe(job1.id);
    });

    it("should not claim already running or completed jobs", async () => {
      await repository.create({
        type: "agent",
        parameters: { prompt: "Running" },
        status: "running",
      });

      await repository.create({
        type: "agent",
        parameters: { prompt: "Completed" },
        status: "completed",
      });

      const claimed = await repository.claimNext();
      expect(claimed).toBeUndefined();
    });
  });

  describe("entity linking", () => {
    describe("create with entities", () => {
      it("should create a job with linked entities", async () => {
        const job = await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Test" },
          },
          [
            { entityType: "time_entry", entityId: "entry-1" },
            { entityType: "time_entry", entityId: "entry-2" },
          ]
        );

        expect(job.id).toBeDefined();

        const entities = await repository.listEntitiesByJob(job.id);
        expect(entities).toHaveLength(2);
        expect(entities[0]?.entityType).toBe("time_entry");
        expect(entities[0]?.entityId).toBe("entry-1");
        expect(entities[1]?.entityType).toBe("time_entry");
        expect(entities[1]?.entityId).toBe("entry-2");
      });

      it("should create a job without entities when none provided", async () => {
        const job = await repository.create({
          type: "agent",
          parameters: { prompt: "Test" },
        });

        expect(job.id).toBeDefined();

        const entities = await repository.listEntitiesByJob(job.id);
        expect(entities).toEqual([]);
      });
    });

    describe("listEntitiesByJob", () => {
      it("should return empty array when no entities are linked", async () => {
        const job = await repository.create({
          type: "agent",
          parameters: { prompt: "Test" },
        });

        const entities = await repository.listEntitiesByJob(job.id);
        expect(entities).toEqual([]);
      });

      it("should return all entities for a job", async () => {
        const job = await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Test" },
          },
          [
            { entityType: "time_entry", entityId: "entry-1" },
            { entityType: "time_entry", entityId: "entry-2" },
          ]
        );

        const entities = await repository.listEntitiesByJob(job.id);
        expect(entities).toHaveLength(2);
        expect(entities.map((e) => e.entityId)).toEqual(["entry-1", "entry-2"]);
      });
    });

    describe("listJobsByEntity", () => {
      it("should return empty array when no jobs are linked", async () => {
        const jobs = await repository.listJobsByEntity("time_entry", "entry-1");
        expect(jobs).toEqual([]);
      });

      it("should return all jobs for an entity", async () => {
        const job1 = await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Job 1" },
          },
          [{ entityType: "time_entry", entityId: "entry-1" }]
        );

        const job2 = await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Job 2" },
          },
          [{ entityType: "time_entry", entityId: "entry-1" }]
        );

        const jobs = await repository.listJobsByEntity("time_entry", "entry-1");
        expect(jobs).toHaveLength(2);
        expect(jobs.map((j) => j.jobId).sort()).toEqual(
          [job1.id, job2.id].sort()
        );
      });

      it("should not return jobs for other entities", async () => {
        await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Job 1" },
          },
          [{ entityType: "time_entry", entityId: "entry-1" }]
        );

        await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Job 2" },
          },
          [{ entityType: "time_entry", entityId: "entry-2" }]
        );

        const jobs = await repository.listJobsByEntity("time_entry", "entry-1");
        expect(jobs).toHaveLength(1);
        expect(jobs[0]?.entityId).toBe("entry-1");
      });
    });

    describe("cascade deletion", () => {
      it("should delete job entities when job is deleted", async () => {
        const job = await repository.create(
          {
            type: "agent",
            parameters: { prompt: "Test" },
          },
          [
            { entityType: "time_entry", entityId: "entry-1" },
            { entityType: "time_entry", entityId: "entry-2" },
          ]
        );

        // Verify entities exist
        let entities = await repository.listEntitiesByJob(job.id);
        expect(entities).toHaveLength(2);

        // Delete the job
        await repository.delete(job.id);

        // Verify entities are deleted (cascade)
        entities = await repository.listEntitiesByJob(job.id);
        expect(entities).toEqual([]);
      });
    });
  });
});
