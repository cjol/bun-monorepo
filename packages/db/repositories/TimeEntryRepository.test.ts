import { describe, it, expect, beforeEach } from "bun:test";
import { timeEntrySchema, matterSchema, billSchema } from "@ai-starter/core";
import { DrizzleTimeEntryRepository } from "./TimeEntryRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleTimeEntryRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleTimeEntryRepository>;
  let matterId: string;
  let billId: string;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleTimeEntryRepository({ db });

    // Create a matter for foreign key reference
    const [matter] = await db
      .insert(matterSchema)
      .values({
        clientName: "Test Client",
        matterName: "Test Matter",
      })
      .returning();
    if (!matter) throw new Error("Failed to create matter");
    matterId = matter.id;

    // Create a bill for foreign key reference
    const [bill] = await db
      .insert(billSchema)
      .values({
        matterId,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
      })
      .returning();
    if (!bill) throw new Error("Failed to create bill");
    billId = bill.id;
  });

  describe("get", () => {
    it("should return null when time entry does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return time entry when it exists", async () => {
      await db.insert(timeEntrySchema).values({
        id: "test-id",
        matterId,
        billId,
        date: new Date("2024-01-15"),
        hours: 2.5,
        description: "Test work",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.get("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.matterId).toBe(matterId);
      expect(result?.hours).toBe(2.5);
    });
  });

  describe("create", () => {
    it("should create a new time entry", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix
      const date = new Date("2024-01-15");

      const timeEntry = await repository.create({
        id: "new-id",
        matterId,
        billId,
        date,
        hours: 3.5,
        description: "New work",
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.get(timeEntry.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("new-id");
      expect(result?.matterId).toBe(matterId);
      expect(result?.hours).toBe(3.5);
      expect(timeEntry.createdAt).toEqual(now);
    });

    it("should assign an ID and timestamps for a new time entry", async () => {
      const timeEntry = await repository.create({
        matterId,
        date: new Date("2024-01-15"),
        hours: 1.5,
        description: "Auto entry",
      });

      const result = await repository.get(timeEntry.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a time entry", async () => {
      const timeEntry = await repository.create({
        matterId,
        date: new Date("2024-01-15"),
        hours: 2.0,
        description: "Original description",
      });

      const updated = await repository.update(timeEntry.id, {
        hours: 3.0,
        description: "Updated description",
      });

      expect(updated.hours).toBe(3.0);
      expect(updated.description).toBe("Updated description");
      expect(updated.matterId).toBe(matterId);
    });

    it("should throw notFound when time entry does not exist", async () => {
      expect(
        repository.update("non-existent-id", { hours: 1.0 })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a time entry", async () => {
      const timeEntry = await repository.create({
        matterId,
        date: new Date("2024-01-15"),
        hours: 1.0,
        description: "To delete",
      });

      await repository.delete(timeEntry.id);
      const result = await repository.get(timeEntry.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when time entry does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listAll", () => {
    it("should return empty array when no time entries exist", async () => {
      const results = await repository.listAll();
      expect(results).toEqual([]);
    });

    it("should return all time entries", async () => {
      await repository.create({
        matterId,
        date: new Date("2024-01-15"),
        hours: 1.0,
        description: "Entry 1",
      });
      await repository.create({
        matterId,
        date: new Date("2024-01-16"),
        hours: 2.0,
        description: "Entry 2",
      });

      const results = await repository.listAll();

      expect(results).toHaveLength(2);
    });
  });

  describe("listByMatter", () => {
    it("should return empty array when no time entries for matter", async () => {
      const results = await repository.listByMatter(matterId);
      expect(results).toEqual([]);
    });

    it("should return time entries for specific matter", async () => {
      // Create another matter
      const [matter2] = await db
        .insert(matterSchema)
        .values({
          clientName: "Client 2",
          matterName: "Matter 2",
        })
        .returning();
      if (!matter2) throw new Error("Failed to create matter2");

      await repository.create({
        matterId,
        date: new Date("2024-01-15"),
        hours: 1.0,
        description: "Entry 1",
      });
      await repository.create({
        matterId: matter2.id,
        date: new Date("2024-01-15"),
        hours: 2.0,
        description: "Entry 2",
      });

      const results = await repository.listByMatter(matterId);

      expect(results).toHaveLength(1);
      expect(results[0]?.matterId).toBe(matterId);
    });
  });

  describe("listByBill", () => {
    it("should return empty array when no time entries for bill", async () => {
      const results = await repository.listByBill(billId);
      expect(results).toEqual([]);
    });

    it("should return time entries for specific bill", async () => {
      await repository.create({
        matterId,
        billId,
        date: new Date("2024-01-15"),
        hours: 1.0,
        description: "Entry 1",
      });
      await repository.create({
        matterId,
        date: new Date("2024-01-15"),
        hours: 2.0,
        description: "Entry 2",
      });

      const results = await repository.listByBill(billId);

      expect(results).toHaveLength(1);
      expect(results[0]?.billId).toBe(billId);
    });
  });
});
