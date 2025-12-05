import { describe, it, expect, beforeEach } from "bun:test";
import { DocumentService } from "./DocumentService";
import { DrizzleDocumentRepository } from "@ai-starter/db/repositories";
import { DrizzleDocumentTemplateRepository } from "@ai-starter/db/repositories";
import { DrizzleMatterRepository } from "@ai-starter/db/repositories";
import { MockFileStorage } from "@ai-starter/db/storage";
import type { DB } from "@ai-starter/db";
import { testDB } from "@ai-starter/db/test-utils/db";

describe("DocumentService", () => {
  let db: DB;
  let service: ReturnType<typeof DocumentService>;
  let storage: ReturnType<typeof MockFileStorage>;
  let testMatterId: string;

  beforeEach(async () => {
    storage = MockFileStorage();

    db = await testDB({ seed: false });
    service = DocumentService({
      repos: {
        document: DrizzleDocumentRepository({ db }),
        documentTemplate: DrizzleDocumentTemplateRepository({ db }),
      },
      storage,
    });

    // Create a test matter for foreign key constraints
    const matterRepo = DrizzleMatterRepository({ db });
    const matter = await matterRepo.create({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: "Test Description",
    });
    testMatterId = matter.id;
  });

  describe("getDocumentContent", () => {
    it("should return file content for existing document", async () => {
      const testContent = "Test file content";

      // Create a document first
      const document = await service.createAdHocDocument({
        matterId: testMatterId,
        name: "Test Document",
        content: testContent,
        mimeType: "text/plain",
      });

      const content = await service.getDocumentContent(document.id);
      expect(content.toString("utf8")).toBe(testContent);
    });

    it("should throw for non-existent document", async () => {
      await expect(
        service.getDocumentContent("non-existent-id")
      ).rejects.toThrow();
    });
  });

  describe("generateFromTemplate", () => {
    it("should generate document from template", async () => {
      // Create template
      const templateRepo = DrizzleDocumentTemplateRepository({ db });
      const template = await templateRepo.create({
        name: "Test Template",
        outputFormat: "csv",
        dataSchema: JSON.stringify({
          type: "object",
          properties: { name: { type: "string" } },
        }),
        templateCode: "return `Name,${data.name}`;",
      });

      // Generate document
      const document = await service.generateFromTemplate({
        matterId: testMatterId,
        templateId: template.id,
        data: { name: "John Doe" },
        name: "Generated Document",
      });

      expect(document.name).toBe("Generated Document");
      expect(document.mimeType).toBe("text/csv");
      expect(document.templateId).toBe(template.id);
      expect(document.generatedBy).toBe("agent");

      // Check file was created
      const content = await storage.read(document.storagePath);
      expect(content.toString("utf8")).toBe("Name,John Doe");
    });

    it("should throw for non-existent template", async () => {
      await expect(
        service.generateFromTemplate({
          matterId: testMatterId,
          templateId: "non-existent",
          data: {},
          name: "Test",
        })
      ).rejects.toThrow();
    });
  });

  describe("createAdHocDocument", () => {
    it("should create document without template", async () => {
      const content = "Ad-hoc document content";

      const document = await service.createAdHocDocument({
        matterId: testMatterId,
        name: "Ad-hoc Document",
        content,
        mimeType: "text/plain",
      });

      expect(document.name).toBe("Ad-hoc Document");
      expect(document.mimeType).toBe("text/plain");
      expect(document.templateId).toBeNull();
      expect(document.generatedBy).toBe("user");

      // Check file was created
      const fileContent = await storage.read(document.storagePath);
      expect(fileContent.toString("utf8")).toBe(content);
    });
  });
});
