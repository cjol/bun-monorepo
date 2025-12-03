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
});
