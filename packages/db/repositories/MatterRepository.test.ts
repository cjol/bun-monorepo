import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleMatterRepository } from "./MatterRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleMatterRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleMatterRepository>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleMatterRepository({ db });
  });

  describe("get", () => {
    it("should return null when matter does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return matter when it exists", async () => {
      const matter = await repository.create({
        clientName: "New Client",
        matterName: "New Matter",
        description: "New Description",
      });

      const result = await repository.get(matter.id);

      expect(result).toEqual(matter);
    });
  });

  describe("create", () => {
    it("should create a new matter", async () => {
      const matter = await repository.create({
        clientName: "New Client",
        matterName: "New Matter",
        description: "New Description",
      });

      const result = await repository.get(matter.id);

      expect(result).toEqual({
        id: expect.any(String),
        clientName: "New Client",
        matterName: "New Matter",
        description: "New Description",
        timeEntryMetadataSchema: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("update", () => {
    it("should update a matter", async () => {
      const matter = await repository.create({
        clientName: "Original Client",
        matterName: "Original Matter",
      });

      const updated = await repository.update(matter.id, {
        clientName: "Updated Client",
        description: "Updated Description",
      });

      expect(updated).toMatchObject({
        id: matter.id,
        clientName: "Updated Client",
        matterName: "Original Matter",
        description: "Updated Description",
      });
    });

    it("should throw notFound when matter does not exist", async () => {
      expect(
        repository.update("non-existent-id", { clientName: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a matter", async () => {
      const matter = await repository.create({
        clientName: "To Delete",
        matterName: "To Delete",
      });

      await repository.delete(matter.id);
      const result = await repository.get(matter.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when matter does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listAll", () => {
    it("should return empty array when no matters exist", async () => {
      const results = await repository.listAll();
      expect(results).toEqual([]);
    });

    it("should return all matters", async () => {
      await repository.create({
        clientName: "Client 1",
        matterName: "Matter 1",
      });
      await repository.create({
        clientName: "Client 2",
        matterName: "Matter 2",
      });

      const results = await repository.listAll();

      expect(results).toHaveLength(2);
    });
  });

  describe("timeEntryMetadataSchema", () => {
    it("should store and retrieve simple metadata schema", async () => {
      // Create a test schema using the simple format
      const testSchema = {
        category: { type: "string" as const, name: "Category" },
        priority: {
          type: "enum" as const,
          name: "Priority",
          values: [
            { name: "Low", value: "low" },
            { name: "Medium", value: "medium" },
            { name: "High", value: "high" },
          ],
        },
        hours_estimate: { type: "number" as const, name: "Hours Estimate" },
      };

      // Create a matter with the schema
      const matter = await repository.create({
        clientName: "Test Client",
        matterName: "Test Matter",
        timeEntryMetadataSchema: testSchema,
      });

      // Retrieve the matter
      const retrieved = await repository.get(matter.id);

      // The schema should be stored and retrieved properly
      expect(retrieved).not.toBeNull();
      expect(retrieved!.timeEntryMetadataSchema).not.toBeNull();
      expect(retrieved!.timeEntryMetadataSchema).toEqual(testSchema);

      // Verify each field
      expect(retrieved!.timeEntryMetadataSchema!.category).toEqual({
        type: "string",
        name: "Category",
      });
      expect(retrieved!.timeEntryMetadataSchema!.priority).toEqual({
        type: "enum",
        name: "Priority",
        values: [
          { name: "Low", value: "low" },
          { name: "Medium", value: "medium" },
          { name: "High", value: "high" },
        ],
      });
      expect(retrieved!.timeEntryMetadataSchema!.hours_estimate).toEqual({
        type: "number",
        name: "Hours Estimate",
      });
    });

    it("should handle null timeEntryMetadataSchema", async () => {
      const matter = await repository.create({
        clientName: "Test Client",
        matterName: "Test Matter",
        timeEntryMetadataSchema: null,
      });

      const retrieved = await repository.get(matter.id);
      expect(retrieved!.timeEntryMetadataSchema).toBeNull();
    });
  });
});
