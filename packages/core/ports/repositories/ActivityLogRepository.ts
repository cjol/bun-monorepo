import type { ActivityLog, NewActivityLog } from "../../schema/activityLog";
import type { ActivityLogEntity } from "../../schema/activityLogEntity";

export interface ActivityLogRepository {
  get(id: string): Promise<ActivityLog | undefined>;
  create(
    activity: NewActivityLog,
    entities?: { entityType: string; entityId: string }[]
  ): Promise<ActivityLog>;
  update(id: string, updates: Partial<NewActivityLog>): Promise<ActivityLog>;
  delete(id: string): Promise<void>;
  list(): Promise<ActivityLog[]>;
  listByEntity(entityType: string, entityId: string): Promise<ActivityLog[]>;

  // Entity linking methods
  listEntitiesByActivityLog(
    activityLogId: string
  ): Promise<ActivityLogEntity[]>;
}
