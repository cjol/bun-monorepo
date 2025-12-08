import { describe, it, expect, beforeEach } from "bun:test";
import { DrizzleActivityLogRepository } from "./ActivityLogRepository";
import { testDB } from "../test-utils/db";
import type { DB } from "../db";
import { activityLogEntitySchema } from "@ai-starter/core";
import { notFound as _notFound } from "@hapi/boom";

describe("DrizzleActivityLogRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleActivityLogRepository>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
    repository = DrizzleActivityLogRepository({ db });
  });

  describe("create", () => {
    it("should create an activity log", async () => {
      const activityData = {
        name: "Test Activity",
        type: "agent_job" as const,
        parameters: {
          prompt: "test prompt",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      };

      const result = await repository.create(activityData);

      expect(result).toBeDefined();
      expect(result.name).toBe(activityData.name);
      expect(result.type).toBe(activityData.type);
      expect(result.status).toBe("pending");
      expect(result.parameters).toEqual(activityData.parameters);
    });

    it("should create an activity log with linked entities", async () => {
      const activityData = {
        name: "Test Activity",
        type: "agent_job" as const,
        parameters: {
          prompt: "test prompt",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      };
      const entities = [
        { entityType: "time_entry", entityId: "entry-1" },
        { entityType: "time_entry", entityId: "entry-2" },
      ];

      const result = await repository.create(activityData, entities);

      expect(result).toBeDefined();

      // Check that entities were linked
      const linkedEntities = await repository.listEntitiesByActivityLog(
        result.id
      );
      expect(linkedEntities).toHaveLength(2);
      expect(linkedEntities.map((e) => e.entityId)).toEqual([
        "entry-1",
        "entry-2",
      ]);
    });
  });

  describe("get", () => {
    it("should retrieve an activity log by ID", async () => {
      const activityData = {
        name: "Test Activity",
        type: "agent_job" as const,
        parameters: {
          prompt: "test prompt",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      };

      const created = await repository.create(activityData);
      const retrieved = await repository.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(activityData.name);
    });

    it("should return undefined for non-existent ID", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("list", () => {
    it("should list all activity logs ordered by scheduledAt", async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 1000);

      await repository.create({
        name: "Later Activity",
        type: "agent_job",
        parameters: {
          prompt: "test",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
        scheduledAt: later,
      });

      await repository.create({
        name: "Earlier Activity",
        type: "agent_job",
        parameters: {
          prompt: "test",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
        scheduledAt: now,
      });

      const activities = await repository.list();

      expect(activities).toHaveLength(2);
      expect(activities[0]?.name).toBe("Earlier Activity");
      expect(activities[1]?.name).toBe("Later Activity");
    });
  });

  describe("listByEntity", () => {
    it("should list activities linked to a specific entity", async () => {
      const activity1 = await repository.create({
        name: "Activity 1",
        type: "agent_job",
        parameters: {
          prompt: "test",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      });

      const activity2 = await repository.create({
        name: "Activity 2",
        type: "reviewing_email",
        parameters: {
          to: "test@example.com",
          subject: "Test",
          body: "Test",
          messageId: "msg-1",
          timestamp: "2023-01-01",
        },
      });

      // Link activities to entities
      await db.insert(activityLogEntitySchema).values([
        {
          activityLogId: activity1.id,
          entityType: "time_entry",
          entityId: "entry-1",
        },
        {
          activityLogId: activity1.id,
          entityType: "time_entry",
          entityId: "entry-2",
        },
        {
          activityLogId: activity2.id,
          entityType: "time_entry",
          entityId: "entry-1",
        },
      ]);

      const activitiesForEntry1 = await repository.listByEntity(
        "time_entry",
        "entry-1"
      );
      const activitiesForEntry2 = await repository.listByEntity(
        "time_entry",
        "entry-2"
      );

      expect(activitiesForEntry1).toHaveLength(2);
      expect(activitiesForEntry2).toHaveLength(1);
      expect(activitiesForEntry1.map((a) => a.name)).toEqual([
        "Activity 1",
        "Activity 2",
      ]);
      expect(activitiesForEntry2[0]?.name).toBe("Activity 1");
    });
  });

  describe("update", () => {
    it("should update an activity log", async () => {
      const activityData = {
        name: "Test Activity",
        type: "agent_job" as const,
        parameters: {
          prompt: "test prompt",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      };

      const created = await repository.create(activityData);
      const updated = await repository.update(created.id, {
        status: "completed",
        result: { success: true },
        finishedAt: new Date(),
      });

      expect(updated.status).toBe("completed");
      expect(updated.result).toEqual({ success: true });
      expect(updated.finishedAt).toBeDefined();
      expect(updated.updatedAt).not.toEqual(created.updatedAt);
    });

    it("should throw notFound for non-existent ID", async () => {
      await expect(
        repository.update("non-existent-id", { status: "completed" })
      ).rejects.toThrow("ActivityLog with ID non-existent-id not found");
    });
  });

  describe("delete", () => {
    it("should delete an activity log", async () => {
      const activityData = {
        name: "Test Activity",
        type: "agent_job" as const,
        parameters: {
          prompt: "test prompt",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      };

      const created = await repository.create(activityData);
      await repository.delete(created.id);

      const retrieved = await repository.get(created.id);
      expect(retrieved).toBeUndefined();
    });

    it("should throw notFound for non-existent ID", async () => {
      await expect(repository.delete("non-existent-id")).rejects.toThrow(
        "ActivityLog with ID non-existent-id not found"
      );
    });
  });

  describe("listEntitiesByActivityLog", () => {
    it("should list all entities linked to an activity log", async () => {
      const activity = await repository.create({
        name: "Test Activity",
        type: "agent_job",
        parameters: {
          prompt: "test",
          matterId: "matter-1",
          workflowId: "workflow-1",
        },
      });

      await db.insert(activityLogEntitySchema).values([
        {
          activityLogId: activity.id,
          entityType: "time_entry",
          entityId: "entry-1",
        },
        {
          activityLogId: activity.id,
          entityType: "time_entry",
          entityId: "entry-2",
        },
      ]);

      const entities = await repository.listEntitiesByActivityLog(activity.id);

      expect(entities).toHaveLength(2);
      expect(entities.map((e) => e.entityId)).toEqual(["entry-1", "entry-2"]);
    });
  });
});
