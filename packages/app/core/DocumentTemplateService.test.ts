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
        dataSchema: JSON.stringify({
          type: "object",
          properties: { name: { type: "string" } },
        }),
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
        dataSchema: JSON.stringify({}),
        templateCode: "return 'test';",
      });

      await service.createDocumentTemplate({
        name: "Template 2",
        outputFormat: "html",
        dataSchema: JSON.stringify({}),
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
        dataSchema: JSON.stringify({
          type: "object",
          properties: { name: { type: "string" } },
        }),
        templateCode: "return `Name: ${data.name}`;",
      });

      const result = await service.getDocumentTemplate(template.id);

      expect(result).toEqual({
        id: expect.any(String),
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

  describe("updateDocumentTemplate", () => {
    it("should update a document template", async () => {
      const created = await service.createDocumentTemplate({
        name: "Original Name",
        outputFormat: "csv",
        dataSchema: JSON.stringify({}),
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
        dataSchema: JSON.stringify({}),
        templateCode: "return 'test';",
      });

      await service.deleteDocumentTemplate(created.id);

      const retrieved = await service.getDocumentTemplate(created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("schema validation", () => {
    it("should reject templates with invalid JSON Schema", async () => {
      await expect(
        service.createDocumentTemplate({
          name: "Invalid Schema",
          outputFormat: "csv",
          dataSchema: JSON.stringify({
            type: "invalid-type", // Invalid JSON Schema type
          }),
          templateCode: "return 'test';",
        })
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Invalid JSON Schema"),
        })
      );
    });

    it("should reject templates with invalid JSON", async () => {
      await expect(
        service.createDocumentTemplate({
          name: "Invalid JSON",
          outputFormat: "csv",
          dataSchema: "{ invalid json }", // Invalid JSON
          templateCode: "return 'test';",
        })
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Invalid JSON in dataSchema"),
        })
      );
    });

    it("should reject updates with invalid schema", async () => {
      const created = await service.createDocumentTemplate({
        name: "Test Template",
        outputFormat: "csv",
        dataSchema: JSON.stringify({}),
        templateCode: "return 'test';",
      });

      await expect(
        service.updateDocumentTemplate(created.id, {
          dataSchema: JSON.stringify({
            type: "invalid-type",
          }),
        })
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Invalid JSON Schema"),
        })
      );
    });

    it("should accept valid JSON Schema", async () => {
      const template = await service.createDocumentTemplate({
        name: "Valid Schema",
        outputFormat: "csv",
        dataSchema: JSON.stringify({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name"],
        }),
        templateCode: "return `Name: ${data.name}, Age: ${data.age}`;",
      });

      expect(template).toBeDefined();
      expect(template.name).toBe("Valid Schema");
    });
  });
});
