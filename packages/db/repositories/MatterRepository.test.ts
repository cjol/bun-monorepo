import { describe, it, expect, beforeEach } from "bun:test";
import { matterSchema } from "@ai-starter/core";
import { DrizzleMatterRepository } from "./MatterRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleMatterRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleMatterRepository>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleMatterRepository({ db });
  });

  describe("get", () => {
    it("should return null when matter does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return matter when it exists", async () => {
      await db.insert(matterSchema).values({
        id: "test-id",
        clientName: "Test Client",
        matterName: "Test Matter",
        description: "Test Description",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.get("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.clientName).toBe("Test Client");
      expect(result?.matterName).toBe("Test Matter");
    });
  });

  describe("create", () => {
    it("should create a new matter", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix
      const matter = await repository.create({
        id: "new-id",
        clientName: "New Client",
        matterName: "New Matter",
        description: "New Description",
        createdAt: now,
        updatedAt: now,
      });

      const result = await repository.get(matter.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("new-id");
      expect(result?.clientName).toBe("New Client");
      expect(result?.matterName).toBe("New Matter");
      expect(matter.createdAt).toEqual(now);
    });

    it("should assign an ID and timestamps for a new matter", async () => {
      const matter = await repository.create({
        clientName: "Auto Client",
        matterName: "Auto Matter",
      });

      const result = await repository.get(matter.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a matter", async () => {
      const matter = await repository.create({
        clientName: "Original Client",
        matterName: "Original Matter",
      });

      const updated = await repository.update(matter.id, {
        clientName: "Updated Client",
        description: "Updated Description",
      });

      expect(updated.clientName).toBe("Updated Client");
      expect(updated.matterName).toBe("Original Matter");
      expect(updated.description).toBe("Updated Description");
    });

    it("should throw notFound when matter does not exist", async () => {
      expect(
        repository.update("non-existent-id", { clientName: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a matter", async () => {
      const matter = await repository.create({
        clientName: "To Delete",
        matterName: "To Delete",
      });

      await repository.delete(matter.id);
      const result = await repository.get(matter.id);

      expect(result).toBeNull();
    });

    it("should throw notFound when matter does not exist", async () => {
      expect(repository.delete("non-existent-id")).rejects.toThrow();
    });
  });

  describe("listAll", () => {
    it("should return empty array when no matters exist", async () => {
      const results = await repository.listAll();
      expect(results).toEqual([]);
    });

    it("should return all matters", async () => {
      await repository.create({
        clientName: "Client 1",
        matterName: "Matter 1",
      });
      await repository.create({
        clientName: "Client 2",
        matterName: "Matter 2",
      });

      const results = await repository.listAll();

      expect(results).toHaveLength(2);
    });
  });
});
