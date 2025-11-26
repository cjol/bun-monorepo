import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleBillRepository } from "./BillRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { createBasicTestContext, createTestMatter } from "../test-utils/seed";

describe("DrizzleBillRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleBillRepository>;
  let matterId: string;

  beforeEach(async () => {
    db = await testDB();
    repository = DrizzleBillRepository({ db });

    const { matter } = await createBasicTestContext(db);
    matterId = matter.id;
  });

  describe("get", () => {
    it("should return null when bill does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return bill when it exists", async () => {
      const bill = await repository.create({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
      });

      const result = await repository.get(bill.id);

      expect(result).toEqual(bill);
    });
  });

  describe("create", () => {
    it("should create a new bill", async () => {
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const bill = await repository.create({
        matterId,
        periodStart,
        periodEnd,
      });

      const result = await repository.get(bill.id);

      expect(result).toMatchObject({
        periodStart,
        periodEnd,
        matterId,
        status: "draft",
      });
    });
  });

  describe("update", () => {
    it("should update a bill", async () => {
      const bill = await repository.create({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      const updated = await repository.update(bill.id, {
        status: "finalized",
      });

      expect(updated.status).toBe("finalized");
      expect(updated.matterId).toBe(matterId);
    });

    it("should throw notFound when bill does not exist", async () => {
      expect(
        repository.update("non-existent-id", { status: "finalized" })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a bill", async () => {
      const bill = await repository.create({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
      });

      await repository.delete(bill.id);
      const result = await repository.get(bill.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when bill does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listByMatter", () => {
    it("should return empty array when no bills exist", async () => {
      const results = await repository.listByMatter(matterId);
      expect(results).toEqual([]);
    });

    it("should return all bills", async () => {
      await repository.create({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
      });
      await repository.create({
        matterId,
        periodStart: new Date("2024-02-01"),
        periodEnd: new Date("2024-02-29"),
      });

      const results = await repository.listByMatter(matterId);

      expect(results).toHaveLength(2);
    });
  });

  describe("listByMatter", () => {
    it("should return empty array when no bills for matter", async () => {
      const results = await repository.listByMatter(matterId);
      expect(results).toEqual([]);
    });

    it("should return bills for specific matter", async () => {
      // Create another matter
      const matter2 = await createTestMatter(db, {
        clientName: "Client 2",
        matterName: "Matter 2",
      });
      if (!matter2) throw new Error("Failed to create matter2");

      await repository.create({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
      });
      await repository.create({
        matterId: matter2.id,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
      });

      const results = await repository.listByMatter(matterId);

      expect(results).toHaveLength(1);
      expect(results[0]?.matterId).toBe(matterId);
    });
  });
});
