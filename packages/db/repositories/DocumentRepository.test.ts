import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleDocumentRepository } from "./DocumentRepository";
import { DrizzleMatterRepository } from "./MatterRepository";
import { DrizzleBillRepository } from "./BillRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleDocumentRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleDocumentRepository>;
  let matterRepository: ReturnType<typeof DrizzleMatterRepository>;
  let billRepository: ReturnType<typeof DrizzleBillRepository>;
  let testMatterId: string;
  let testBillId: string;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleDocumentRepository({ db });
    matterRepository = DrizzleMatterRepository({ db });
    billRepository = DrizzleBillRepository({ db });

    // Create a test matter for foreign key constraints
    const matter = await matterRepository.create({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: "Test Description",
    });
    testMatterId = matter.id;

    // Create a test bill for foreign key constraints
    const bill = await billRepository.create({
      matterId: testMatterId,
      periodStart: new Date("2024-01-01"),
      periodEnd: new Date("2024-01-31"),
      status: "draft",
    });
    testBillId = bill.id;
  });

  describe("get", () => {
    it("should return null when document does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return document when it exists", async () => {
      const document = await repository.create({
        matterId: testMatterId,
        billId: null,
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
        billId: null,
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
        billId: null,
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
        billId: null,
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
        billId: null,
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
        billId: null,
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

  describe("listByBill", () => {
    it("should list documents by bill", async () => {
      // Create another bill for testing
      const otherBill = await billRepository.create({
        matterId: testMatterId,
        periodStart: new Date("2024-02-01"),
        periodEnd: new Date("2024-02-29"),
        status: "draft",
      });

      await repository.create({
        matterId: testMatterId,
        billId: testBillId,
        templateId: null,
        name: "Bill Document 1",
        mimeType: "text/csv",
        storagePath: "documents/bill1.csv",
        fileSize: 1024,
        generatedBy: "agent",
        metadata: null,
      });

      await repository.create({
        matterId: testMatterId,
        billId: testBillId,
        templateId: null,
        name: "Bill Document 2",
        mimeType: "text/html",
        storagePath: "documents/bill2.html",
        fileSize: 2048,
        generatedBy: "user",
        metadata: null,
      });

      await repository.create({
        matterId: testMatterId,
        billId: otherBill.id,
        templateId: null,
        name: "Other Bill Document",
        mimeType: "text/csv",
        storagePath: "documents/other-bill.csv",
        fileSize: 512,
        generatedBy: "agent",
        metadata: null,
      });

      await repository.create({
        matterId: testMatterId,
        billId: null,
        templateId: null,
        name: "Unassociated Document",
        mimeType: "text/csv",
        storagePath: "documents/unassociated.csv",
        fileSize: 256,
        generatedBy: "agent",
        metadata: null,
      });

      const documents = await repository.listByBill(testBillId);
      expect(documents).toHaveLength(2);
      expect(documents.map((d) => d.name)).toEqual([
        "Bill Document 2",
        "Bill Document 1",
      ]); // Ordered by createdAt desc
    });
  });

  describe("delete", () => {
    it("should delete a document", async () => {
      const created = await repository.create({
        matterId: testMatterId,
        billId: null,
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
