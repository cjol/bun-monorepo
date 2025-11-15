import type { TimeEntryChangeLog, NewTimeEntryChangeLog } from "../../schema";

export interface TimeEntryChangeLogRepository {
  insert(data: NewTimeEntryChangeLog): Promise<TimeEntryChangeLog>;
  listByTimeEntry(timeEntryId: string): Promise<TimeEntryChangeLog[]>;
}
