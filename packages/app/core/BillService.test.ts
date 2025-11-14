import { describe, it, expect, beforeEach } from "bun:test";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { BillService } from "./BillService";
import { MatterService } from "./MatterService";

describe("BillService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof BillService>;
  let matterService: ReturnType<typeof MatterService>;
  let matterId: string;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repos = await getRepos(db);
    service = BillService({ repos });
    matterService = MatterService({ repos });

    const matter = await matterService.createMatter({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: null,
    });
    matterId = matter.id;
  });

  describe("getBill", () => {
    it("should return a bill by id", async () => {
      const created = await service.createBill({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      const result = await service.getBill(created.id);
      expect(result).toEqual(created);
    });

    it("should return null if bill does not exist", async () => {
      const result = await service.getBill("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("createBill", () => {
    it("should validate and create a new bill", async () => {
      const result = await service.createBill({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      expect(result).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should throw an error if status is invalid", async () => {
      await expect(
        service.createBill({
          matterId,
          periodStart: new Date("2024-01-01"),
          periodEnd: new Date("2024-01-31"),
          status: "invalid" as "draft",
        })
      ).rejects.toThrow();
    });
  });

  describe("updateBill", () => {
    it("should update bill fields", async () => {
      const created = await service.createBill({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateBill(created.id, {
        status: "finalized",
      });

      expect(result).toEqual({
        id: created.id,
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "finalized",
        createdAt: created.createdAt,
        updatedAt: expect.any(Date),
      });
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime()
      );
    });

    it("should validate updated fields", async () => {
      const created = await service.createBill({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      await expect(
        service.updateBill(created.id, {
          status: "invalid" as "draft",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteBill", () => {
    it("should delete a bill", async () => {
      const created = await service.createBill({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      await service.deleteBill(created.id);

      const result = await service.getBill(created.id);
      expect(result).toBeNull();
    });
  });

  describe("listByMatter", () => {
    it("should list all bills for a matter", async () => {
      const bill1 = await service.createBill({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        status: "draft",
      });

      const bill2 = await service.createBill({
        matterId,
        periodStart: new Date("2024-02-01"),
        periodEnd: new Date("2024-02-28"),
        status: "finalized",
      });

      const result = await service.listByMatter(matterId);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(bill1);
      expect(result).toContainEqual(bill2);
    });

    it("should return empty array if no bills exist", async () => {
      const result = await service.listByMatter(matterId);
      expect(result).toEqual([]);
    });
  });
});
