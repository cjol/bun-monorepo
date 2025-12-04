import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleDocumentTemplateRepository } from "./DocumentTemplateRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleDocumentTemplateRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleDocumentTemplateRepository>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleDocumentTemplateRepository({ db });
  });

  describe("get", () => {
    it("should return null when document template does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return document template when it exists", async () => {
      const template = await repository.create({
        name: "Test Template",
        description: "A test template",
        outputFormat: "csv",
        dataSchema: {
          type: "object",
          properties: { name: { type: "string" } },
        },
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
        description: "A test template",
        outputFormat: "csv",
        dataSchema: {
          type: "object",
          properties: { name: { type: "string" } },
        },
        templateCode: "return `Name: ${data.name}`;",
      });

      const result = await repository.get(template.id);

      expect(result).toEqual({
        id: expect.any(String),
        name: "Test Template",
        description: "A test template",
        outputFormat: "csv",
        dataSchema: {
          type: "object",
          properties: { name: { type: "string" } },
        },
        templateCode: "return `Name: ${data.name}`;",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("listAll", () => {
    it("should list all document templates", async () => {
      await repository.create({
        name: "Template 1",
        outputFormat: "csv",
        dataSchema: {},
        templateCode: "return 'test';",
      });

      await repository.create({
        name: "Template 2",
        outputFormat: "html",
        dataSchema: {},
        templateCode: "return '<p>test</p>';",
      });

      const templates = await repository.listAll();
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
        outputFormat: "csv",
        dataSchema: {},
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
        outputFormat: "csv",
        dataSchema: {},
        templateCode: "return 'test';",
      });

      await repository.delete(created.id);

      const retrieved = await repository.get(created.id);
      expect(retrieved).toBeNull();
    });
  });
});
