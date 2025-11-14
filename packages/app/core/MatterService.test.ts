import { describe, it, expect, beforeEach } from "bun:test";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { MatterService } from "./MatterService";

describe("MatterService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof MatterService>;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = MatterService({ repos });
  });

  describe("getMatter", () => {
    it("should return a matter by id", async () => {
      const created = await service.createMatter({
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: "Annual contract review",
      });

      const result = await service.getMatter(created.id);
      expect(result).toEqual(created);
    });

    it("should return null if matter does not exist", async () => {
      const result = await service.getMatter("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("createMatter", () => {
    it("should validate and create a new matter", async () => {
      const result = await service.createMatter({
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: "Annual contract review",
      });

      expect(result).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: "Annual contract review",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should create a matter with null description", async () => {
      const result = await service.createMatter({
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: null,
      });

      expect(result.description).toBeNull();
    });

    it("should throw an error if clientName is empty", async () => {
      await expect(
        service.createMatter({
          clientName: "",
          matterName: "Contract Review",
          description: null,
        })
      ).rejects.toThrow();
    });

    it("should throw an error if matterName is empty", async () => {
      await expect(
        service.createMatter({
          clientName: "Acme Corp",
          matterName: "",
          description: null,
        })
      ).rejects.toThrow();
    });
  });

  describe("updateMatter", () => {
    it("should update matter fields", async () => {
      const created = await service.createMatter({
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: "Initial description",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateMatter(created.id, {
        matterName: "Updated Contract Review",
        description: "Updated description",
      });

      expect(result).toEqual({
        id: created.id,
        clientName: "Acme Corp",
        matterName: "Updated Contract Review",
        description: "Updated description",
        createdAt: created.createdAt,
        updatedAt: expect.any(Date),
      });
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime()
      );
    });

    it("should validate updated fields", async () => {
      const created = await service.createMatter({
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: null,
      });

      await expect(
        service.updateMatter(created.id, {
          clientName: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteMatter", () => {
    it("should delete a matter", async () => {
      const created = await service.createMatter({
        clientName: "Acme Corp",
        matterName: "Contract Review",
        description: null,
      });

      await service.deleteMatter(created.id);

      const result = await service.getMatter(created.id);
      expect(result).toBeNull();
    });
  });
});
