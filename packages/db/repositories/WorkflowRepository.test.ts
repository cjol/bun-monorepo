import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleWorkflowRepository } from "./WorkflowRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { createBasicTestContext, type BasicTestContext } from "../test-utils";

describe("DrizzleWorkflowRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleWorkflowRepository>;
  let context: BasicTestContext;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleWorkflowRepository({ db });

    // Create a matter for foreign key reference
    context = await createBasicTestContext(db);
  });

  describe("get", () => {
    it("should return null when workflow does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new workflow", async () => {
      const workflow = await repository.create({
        matterId: context.matter.id,
        name: "New Workflow",
        instructions: "Follow these steps...",
      });

      const result = await repository.get(workflow.id);
      expect(result).toMatchObject({
        id: workflow.id,
        matterId: context.matter.id,
        name: "New Workflow",
        instructions: "Follow these steps...",
        createdAt: expect.any(Date),
      });
    });
  });

  describe("update", () => {
    it("should update a workflow", async () => {
      const workflow = await repository.create({
        matterId: context.matter.id,
        name: "Original Name",
        instructions: "Original instructions",
      });

      const updated = await repository.update(workflow.id, {
        name: "Updated Name",
      });

      expect(updated).toMatchObject({
        id: workflow.id,
        matterId: context.matter.id,
        name: "Updated Name",
        instructions: "Original instructions",
      });
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
        matterId: context.matter.id,
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
      const results = await repository.listByMatter(context.matter.id);
      expect(results).toEqual([]);
    });

    it("should return all workflows for matter", async () => {
      await repository.create({
        matterId: context.matter.id,
        name: "Workflow 1",
        instructions: "Instructions 1",
      });
      await repository.create({
        matterId: context.matter.id,
        name: "Workflow 2",
        instructions: "Instructions 2",
      });

      const results = await repository.listByMatter(context.matter.id);

      expect(results).toHaveLength(2);
    });
  });
});
