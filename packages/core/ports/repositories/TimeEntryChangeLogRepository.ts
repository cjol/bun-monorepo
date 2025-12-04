import type { TimeEntryChangeLog, NewTimeEntryChangeLog } from "../../schema";

export interface TimeEntryChangeLogRepository {
  insertMany(data: NewTimeEntryChangeLog[]): Promise<TimeEntryChangeLog[]>;
  insert(data: NewTimeEntryChangeLog): Promise<TimeEntryChangeLog>;
  listByTimeEntry(timeEntryId: string): Promise<TimeEntryChangeLog[]>;
}
