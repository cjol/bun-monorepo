import {
  type TimeEntryRepository,
  type TimeEntryChangeLogRepository,
  type TimeEntry,
  type NewTimeEntry,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
  };
}

export const TimeEntryService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getTimeEntry: repos.timeEntry.get,
    listByMatter: repos.timeEntry.listByMatter,
    listByBill: repos.timeEntry.listByMatterAndBill,

    createTimeEntry: async (data: NewTimeEntry): Promise<TimeEntry> => {
      const created: TimeEntry = await repos.timeEntry.create(data);

      await repos.timeEntryChangeLog.insert({
        timeEntryId: created.id,
        beforeData: null,
        afterData: created,
      });

      return created;
    },

    updateTimeEntry: async (
      id: string,
      data: Partial<{
        matterId: string;
        billId: string | null;
        date: Date;
        hours: number;
        description: string;
      }>
    ): Promise<TimeEntry> => {
      // Get the existing entry for the changelog
      const existing = await repos.timeEntry.get(id);
      if (!existing) {
        throw new Error(`TimeEntry with id ${id} not found`);
      }

      const updated = await repos.timeEntry.update(id, {
        ...data,
      });

      // Log the update
      await repos.timeEntryChangeLog.insert({
        timeEntryId: updated.id,
        beforeData: existing,
        afterData: updated,
      });

      return updated;
    },
  };
};

export type TimeEntryService = ReturnType<typeof TimeEntryService>;
