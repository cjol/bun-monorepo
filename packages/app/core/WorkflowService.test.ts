import { describe, it, expect, beforeEach } from "bun:test";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { WorkflowService } from "./WorkflowService";

describe("WorkflowService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof WorkflowService>;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = WorkflowService({ repos });
  });

  describe("getWorkflow", () => {
    it("should return a workflow by id", async () => {
      const created = await service.createWorkflow({
        name: "Daily Report",
        instructions: "Generate a daily summary of all time entries",
      });

      const result = await service.getWorkflow(created.id);
      expect(result).toEqual(created);
    });

    it("should return null if workflow does not exist", async () => {
      const result = await service.getWorkflow("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("createWorkflow", () => {
    it("should validate and create a new workflow", async () => {
      const result = await service.createWorkflow({
        name: "Daily Report",
        instructions: "Generate a daily summary of all time entries",
      });

      expect(result).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        name: "Daily Report",
        instructions: "Generate a daily summary of all time entries",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should throw an error if name is empty", async () => {
      await expect(
        service.createWorkflow({
          name: "",
          instructions: "Some instructions",
        })
      ).rejects.toThrow();
    });

    it("should throw an error if instructions are empty", async () => {
      await expect(
        service.createWorkflow({
          name: "Daily Report",
          instructions: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("updateWorkflow", () => {
    it("should update workflow fields", async () => {
      const created = await service.createWorkflow({
        name: "Daily Report",
        instructions: "Generate a daily summary",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateWorkflow(created.id, {
        name: "Updated Daily Report",
        instructions: "Generate an updated daily summary",
      });

      expect(result).toEqual({
        id: created.id,
        name: "Updated Daily Report",
        instructions: "Generate an updated daily summary",
        createdAt: created.createdAt,
        updatedAt: expect.any(Date),
      });
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime()
      );
    });

    it("should validate updated fields", async () => {
      const created = await service.createWorkflow({
        name: "Daily Report",
        instructions: "Generate a daily summary",
      });

      await expect(
        service.updateWorkflow(created.id, {
          name: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteWorkflow", () => {
    it("should delete a workflow", async () => {
      const created = await service.createWorkflow({
        name: "Daily Report",
        instructions: "Generate a daily summary",
      });

      await service.deleteWorkflow(created.id);

      const result = await service.getWorkflow(created.id);
      expect(result).toBeNull();
    });
  });

  describe("listAll", () => {
    it("should list all workflows", async () => {
      const workflow1 = await service.createWorkflow({
        name: "Daily Report",
        instructions: "Generate a daily summary",
      });

      const workflow2 = await service.createWorkflow({
        name: "Weekly Report",
        instructions: "Generate a weekly summary",
      });

      const result = await service.listAll();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(workflow1);
      expect(result).toContainEqual(workflow2);
    });

    it("should return empty array if no workflows exist", async () => {
      const result = await service.listAll();
      expect(result).toEqual([]);
    });
  });
});
