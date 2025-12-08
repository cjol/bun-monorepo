import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleDocumentRepository } from "./DocumentRepository";
import { DrizzleMatterRepository } from "./MatterRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleDocumentRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleDocumentRepository>;
  let matterRepository: ReturnType<typeof DrizzleMatterRepository>;
  let testMatterId: string;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleDocumentRepository({ db });
    matterRepository = DrizzleMatterRepository({ db });

    // Create a test matter for foreign key constraints
    const matter = await matterRepository.create({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: "Test Description",
    });
    testMatterId = matter.id;
  });

  describe("get", () => {
    it("should return null when document does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return document when it exists", async () => {
      const document = await repository.create({
        matterId: testMatterId,
        templateId: null,
        name: "Test Document",
        mimeType: "text/csv",
        storagePath: "documents/test.csv",
        fileSize: 1024,
        generatedBy: "agent",
        metadata: null,
      });

      const result = await repository.get(document.id);

      expect(result).toEqual(document);
    });
  });

  describe("create", () => {
    it("should create a new document", async () => {
      const document = await repository.create({
        matterId: testMatterId,
        templateId: null,
        name: "Test Document",
        mimeType: "text/csv",
        storagePath: "documents/test.csv",
        fileSize: 1024,
        generatedBy: "agent",
        metadata: null,
      });

      const result = await repository.get(document.id);

      expect(result).toEqual({
        id: expect.any(String),
        matterId: testMatterId,
        templateId: null,
        name: "Test Document",
        mimeType: "text/csv",
        storagePath: "documents/test.csv",
        fileSize: 1024,
        generatedBy: "agent",
        metadata: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("listByMatter", () => {
    it("should list documents by matter", async () => {
      // Create another matter for testing
      const otherMatter = await matterRepository.create({
        clientName: "Other Client",
        matterName: "Other Matter",
        description: "Other Description",
      });

      await repository.create({
        matterId: testMatterId,
        templateId: null,
        name: "Document 1",
        mimeType: "text/csv",
        storagePath: "documents/test1.csv",
        fileSize: 1024,
        generatedBy: "agent",
        metadata: null,
      });

      await repository.create({
        matterId: testMatterId,
        templateId: null,
        name: "Document 2",
        mimeType: "text/html",
        storagePath: "documents/test2.html",
        fileSize: 2048,
        generatedBy: "user",
        metadata: null,
      });

      await repository.create({
        matterId: otherMatter.id,
        templateId: null,
        name: "Other Matter Document",
        mimeType: "text/csv",
        storagePath: "documents/other.csv",
        fileSize: 512,
        generatedBy: "agent",
        metadata: null,
      });

      const documents = await repository.listByMatter(testMatterId);
      expect(documents).toHaveLength(2);
      expect(documents.map((d) => d.name)).toEqual([
        "Document 2",
        "Document 1",
      ]); // Ordered by createdAt desc
    });
  });

  describe("delete", () => {
    it("should delete a document", async () => {
      const created = await repository.create({
        matterId: testMatterId,
        templateId: null,
        name: "To Delete",
        mimeType: "text/csv",
        storagePath: "documents/test.csv",
        fileSize: 1024,
        generatedBy: "agent",
        metadata: null,
      });

      await repository.delete(created.id);

      const retrieved = await repository.get(created.id);
      expect(retrieved).toBeNull();
    });
  });
});
