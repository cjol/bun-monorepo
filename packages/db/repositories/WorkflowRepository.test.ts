import { describe, it, expect, beforeEach } from "bun:test";
import { workflowSchema, matterSchema } from "@ai-starter/core";
import { DrizzleWorkflowRepository } from "./WorkflowRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleWorkflowRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleWorkflowRepository>;
  let matterId: string;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleWorkflowRepository({ db });

    // Create a matter for foreign key reference
    const [matter] = await db
      .insert(matterSchema)
      .values({
        clientName: "Test Client",
        matterName: "Test Matter",
      })
      .returning();
    if (!matter) throw new Error("Failed to create matter");
    matterId = matter.id;
  });

  describe("get", () => {
    it("should return null when workflow does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return workflow when it exists", async () => {
      await db.insert(workflowSchema).values({
        id: "test-id",
        matterId,
        name: "Test Workflow",
        instructions: "Do this and that",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.get("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.name).toBe("Test Workflow");
      expect(result?.instructions).toBe("Do this and that");
    });
  });

  describe("create", () => {
    it("should create a new workflow", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix
      const workflow = await repository.create({
        id: "new-id",
        matterId,
        name: "New Workflow",
        instructions: "Follow these steps...",
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.get(workflow.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("new-id");
      expect(result?.name).toBe("New Workflow");
      expect(result?.instructions).toBe("Follow these steps...");
      expect(workflow.createdAt).toEqual(now);
    });

    it("should assign an ID and timestamps for a new workflow", async () => {
      const workflow = await repository.create({
        matterId,
        name: "Auto Workflow",
        instructions: "Automated instructions",
      });

      const result = await repository.get(workflow.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a workflow", async () => {
      const workflow = await repository.create({
        matterId,
        name: "Original Name",
        instructions: "Original instructions",
      });

      const updated = await repository.update(workflow.id, {
        name: "Updated Name",
        instructions: "Updated instructions",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.instructions).toBe("Updated instructions");
    });

    it("should partially update a workflow", async () => {
      const workflow = await repository.create({
        matterId,
        name: "Original Name",
        instructions: "Original instructions",
      });

      const updated = await repository.update(workflow.id, {
        instructions: "Only instructions updated",
      });

      expect(updated.name).toBe("Original Name");
      expect(updated.instructions).toBe("Only instructions updated");
    });

    it("should throw notFound when workflow does not exist", async () => {
      expect(
        repository.update("non-existent-id", { name: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a workflow", async () => {
      const workflow = await repository.create({
        matterId,
        name: "To Delete",
        instructions: "Will be deleted",
      });

      await repository.delete(workflow.id);
      const result = await repository.get(workflow.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when workflow does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listByMatter", () => {
    it("should return empty array when no workflows exist", async () => {
      const results = await repository.listByMatter(matterId);
      expect(results).toEqual([]);
    });

    it("should return all workflows for matter", async () => {
      await repository.create({
        matterId,
        name: "Workflow 1",
        instructions: "Instructions 1",
      });
      await repository.create({
        matterId,
        name: "Workflow 2",
        instructions: "Instructions 2",
      });

      const results = await repository.listByMatter(matterId);

      expect(results).toHaveLength(2);
    });
  });
});
