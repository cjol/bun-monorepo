import type { TimeEntry, NewTimeEntry } from "../../schema";

export interface TimeEntryRepository {
  get(id: string): Promise<TimeEntry | null>;
  listByMatter(matterId: string): Promise<TimeEntry[]>;
  listByMatterAndBill(matterId: string, billId: string): Promise<TimeEntry[]>;
  create(data: NewTimeEntry): Promise<TimeEntry>;
  update(id: string, data: Partial<NewTimeEntry>): Promise<TimeEntry>;
  delete(id: string): Promise<void>;
}
