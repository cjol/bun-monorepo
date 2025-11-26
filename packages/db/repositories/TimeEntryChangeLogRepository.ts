import {
  timeEntryChangeLogSchema,
  type TimeEntryChangeLogRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleTimeEntryChangeLogRepository = ({
  db,
}: Deps): TimeEntryChangeLogRepository => ({
  async insert(data) {
    const [result] = await db
      .insert(timeEntryChangeLogSchema)
      .values(data)
      .returning();
    if (!result) throw badImplementation("Failed to insert TimeEntryChangeLog");
    return result;
  },
  async listByTimeEntry(timeEntryId: string) {
    const results = await db.query.timeEntryChangeLogSchema.findMany({
      where: eq(timeEntryChangeLogSchema.timeEntryId, timeEntryId),
    });
    return results;
  },
});
