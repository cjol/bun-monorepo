import { activityLogSchema, activityLogEntitySchema } from "@ai-starter/core";
import type { ActivityLogRepository } from "@ai-starter/core/ports/repositories/ActivityLogRepository";
import type { DB } from "../db";
import { eq, asc, and, inArray } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleActivityLogRepository = ({
  db,
}: Deps): ActivityLogRepository => ({
  async get(id: string) {
    const result = await db.query.activityLogSchema.findFirst({
      where: eq(activityLogSchema.id, id),
    });
    return result;
  },

  async list() {
    return db.query.activityLogSchema.findMany({
      orderBy: [asc(activityLogSchema.scheduledAt)],
    });
  },

  async listByEntity(entityType: string, entityId: string) {
    // First, get all activity log IDs that are linked to this entity
    const entityLinks = await db.query.activityLogEntitySchema.findMany({
      where: and(
        eq(activityLogEntitySchema.entityType, entityType as "time_entry"),
        eq(activityLogEntitySchema.entityId, entityId)
      ),
    });

    if (entityLinks.length === 0) {
      return [];
    }

    const activityLogIds = entityLinks.map((link) => link.activityLogId);

    // Then fetch the activity logs
    return db.query.activityLogSchema.findMany({
      where: inArray(activityLogSchema.id, activityLogIds),
      orderBy: [asc(activityLogSchema.scheduledAt)],
    });
  },

  async create(
    data: Parameters<ActivityLogRepository["create"]>[0],
    entities?: Parameters<ActivityLogRepository["create"]>[1]
  ) {
    const [result] = await db
      .insert(activityLogSchema)
      .values(data)
      .returning();
    if (!result) throw badImplementation("Failed to create ActivityLog");

    // Link entities if provided
    if (entities && entities.length > 0) {
      await db.insert(activityLogEntitySchema).values(
        entities.map((entity) => ({
          activityLogId: result.id,
          entityType: entity.entityType as "time_entry",
          entityId: entity.entityId,
        }))
      );
    }

    return result;
  },

  async update(
    id: string,
    data: Parameters<ActivityLogRepository["update"]>[1]
  ) {
    const [result] = await db
      .update(activityLogSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(activityLogSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`ActivityLog with ID ${id} not found`, { id });
    }
    return result;
  },

  async delete(id: string) {
    const [result] = await db
      .delete(activityLogSchema)
      .where(eq(activityLogSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`ActivityLog with ID ${id} not found`, { id });
    }
  },

  async listEntitiesByActivityLog(activityLogId: string) {
    return db.query.activityLogEntitySchema.findMany({
      where: eq(activityLogEntitySchema.activityLogId, activityLogId),
    });
  },
});
