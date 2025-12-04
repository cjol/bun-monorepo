import { describe, it, expect, beforeEach } from "bun:test";
import { DocumentTemplateService } from "./DocumentTemplateService";
import { DrizzleDocumentTemplateRepository } from "@ai-starter/db/repositories";
import type { DB } from "@ai-starter/db";
import { testDB } from "@ai-starter/db/test-utils/db";

describe("DocumentTemplateService", () => {
  let db: DB;
  let service: ReturnType<typeof DocumentTemplateService>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    service = DocumentTemplateService({
      repos: {
        documentTemplate: DrizzleDocumentTemplateRepository({ db }),
      },
    });
  });

  describe("getDocumentTemplate", () => {
    it("should return null when template does not exist", async () => {
      const result = await service.getDocumentTemplate("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return template when it exists", async () => {
      const template = await service.createDocumentTemplate({
        name: "Test Template",
        description: "A test template",
        outputFormat: "csv",
        dataSchema: {
          type: "object",
          properties: { name: { type: "string" } },
        },
        templateCode: "return `Name: ${data.name}`;",
      });

      const result = await service.getDocumentTemplate(template.id);

      expect(result).toEqual(template);
    });
  });

  describe("listDocumentTemplates", () => {
    it("should list all document templates", async () => {
      await service.createDocumentTemplate({
        name: "Template 1",
        outputFormat: "csv",
        dataSchema: {},
        templateCode: "return 'test';",
      });

      await service.createDocumentTemplate({
        name: "Template 2",
        outputFormat: "html",
        dataSchema: {},
        templateCode: "return '<p>test</p>';",
      });

      const templates = await service.listDocumentTemplates();
      expect(templates).toHaveLength(2);
      expect(templates.map((t) => t.name)).toEqual([
        "Template 1",
        "Template 2",
      ]);
    });
  });

  describe("createDocumentTemplate", () => {
    it("should create a new document template", async () => {
      const template = await service.createDocumentTemplate({
        name: "Test Template",
        description: "A test template",
        outputFormat: "csv",
        dataSchema: {
          type: "object",
          properties: { name: { type: "string" } },
        },
        templateCode: "return `Name: ${data.name}`;",
      });

      const result = await service.getDocumentTemplate(template.id);

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

  describe("updateDocumentTemplate", () => {
    it("should update a document template", async () => {
      const created = await service.createDocumentTemplate({
        name: "Original Name",
        outputFormat: "csv",
        dataSchema: {},
        templateCode: "return 'test';",
      });

      const updated = await service.updateDocumentTemplate(created.id, {
        name: "Updated Name",
        description: "Updated description",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
    });
  });

  describe("deleteDocumentTemplate", () => {
    it("should delete a document template", async () => {
      const created = await service.createDocumentTemplate({
        name: "To Delete",
        outputFormat: "csv",
        dataSchema: {},
        templateCode: "return 'test';",
      });

      await service.deleteDocumentTemplate(created.id);

      const retrieved = await service.getDocumentTemplate(created.id);
      expect(retrieved).toBeNull();
    });
  });
});
