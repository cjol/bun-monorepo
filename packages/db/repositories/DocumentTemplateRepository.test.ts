import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleDocumentTemplateRepository } from "./DocumentTemplateRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { createBasicTestContext, type BasicTestContext } from "../test-utils";

describe("DrizzleDocumentTemplateRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleDocumentTemplateRepository>;
  let context: BasicTestContext;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleDocumentTemplateRepository({ db });
    context = await createBasicTestContext(db);
  });

  describe("get", () => {
    it("should return null when document template does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return document template when it exists", async () => {
      const template = await repository.create({
        name: "Test Template",
        matterId: context.matter.id,
        description: "A test template",
        outputFormat: "csv",
        dataSchema: JSON.stringify({
          type: "object",
          properties: { name: { type: "string" } },
        }),
        templateCode: "return `Name: ${data.name}`;",
      });

      const result = await repository.get(template.id);

      expect(result).toEqual(template);
    });
  });

  describe("create", () => {
    it("should create a new document template", async () => {
      const template = await repository.create({
        name: "Test Template",
        matterId: context.matter.id,
        description: "A test template",
        outputFormat: "csv",
        dataSchema: JSON.stringify({
          type: "object",
          properties: { name: { type: "string" } },
        }),
        templateCode: "return `Name: ${data.name}`;",
      });

      const result = await repository.get(template.id);

      expect(result).toEqual({
        id: expect.any(String),
        matterId: context.matter.id,
        name: "Test Template",
        description: "A test template",
        outputFormat: "csv",
        dataSchema: JSON.stringify({
          type: "object",
          properties: { name: { type: "string" } },
        }),
        templateCode: "return `Name: ${data.name}`;",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("listAll", () => {
    it("should list all document templates", async () => {
      await repository.create({
        matterId: context.matter.id,
        name: "Template 1",
        outputFormat: "csv",
        dataSchema: JSON.stringify({}),
        templateCode: "return 'test';",
      });

      await repository.create({
        name: "Template 2",
        matterId: context.matter.id,
        outputFormat: "html",
        dataSchema: JSON.stringify({}),
        templateCode: "return '<p>test</p>';",
      });

      const templates = await repository.listByMatter(context.matter.id);
      expect(templates).toHaveLength(2);
      expect(templates.map((t) => t.name)).toEqual([
        "Template 1",
        "Template 2",
      ]);
    });
  });

  describe("update", () => {
    it("should update a document template", async () => {
      const created = await repository.create({
        name: "Original Name",
        matterId: context.matter.id,
        outputFormat: "csv",
        dataSchema: JSON.stringify({}),
        templateCode: "return 'test';",
      });

      const updated = await repository.update(created.id, {
        name: "Updated Name",
        description: "Updated description",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
    });
  });

  describe("delete", () => {
    it("should delete a document template", async () => {
      const created = await repository.create({
        name: "To Delete",
        matterId: context.matter.id,
        outputFormat: "csv",
        dataSchema: JSON.stringify({}),
        templateCode: "return 'test';",
      });

      await repository.delete(created.id);

      const retrieved = await repository.get(created.id);
      expect(retrieved).toBeNull();
    });
  });
});
