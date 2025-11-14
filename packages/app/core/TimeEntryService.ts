import {
  type TimeEntryRepository,
  type TimeEntryChangeLogRepository,
  type TimeEntry,
  type NewTimeEntry,
  type NewTimeEntryChangeLog,
  timeEntryValidator,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
  };
}

const serializeTimeEntry = (entry: TimeEntry): Record<string, unknown> => {
  return {
    id: entry.id,
    matterId: entry.matterId,
    billId: entry.billId,
    date: entry.date.toISOString(),
    hours: entry.hours,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
};

export const TimeEntryService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getTimeEntry: async (id: string): Promise<TimeEntry | null> => {
      return repos.timeEntry.get(id);
    },

    createTimeEntry: async (data: {
      matterId: string;
      billId: string | null;
      date: Date;
      hours: number;
      description: string;
    }): Promise<TimeEntry> => {
      const newTimeEntry: NewTimeEntry = {
        id: crypto.randomUUID(),
        matterId: data.matterId,
        billId: data.billId,
        date: data.date,
        hours: data.hours,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      timeEntryValidator.parse(newTimeEntry);
      const created = await repos.timeEntry.create(newTimeEntry);

      // Log the creation
      const changeLog: NewTimeEntryChangeLog = {
        id: crypto.randomUUID(),
        timeEntryId: created.id,
        beforeData: null,
        afterData: serializeTimeEntry(created),
        changedAt: new Date(),
      };
      await repos.timeEntryChangeLog.insert(changeLog);

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

      // Validate individual fields if provided
      if (data.matterId !== undefined) {
        timeEntryValidator.shape.matterId.parse(data.matterId);
      }
      if (data.billId !== undefined) {
        timeEntryValidator.shape.billId.parse(data.billId);
      }
      if (data.date !== undefined) {
        timeEntryValidator.shape.date.parse(data.date);
      }
      if (data.hours !== undefined) {
        timeEntryValidator.shape.hours.parse(data.hours);
      }
      if (data.description !== undefined) {
        timeEntryValidator.shape.description.parse(data.description);
      }

      const updated = await repos.timeEntry.update(id, {
        ...data,
        updatedAt: new Date(),
      });

      // Log the update
      const changeLog: NewTimeEntryChangeLog = {
        id: crypto.randomUUID(),
        timeEntryId: updated.id,
        beforeData: serializeTimeEntry(existing),
        afterData: serializeTimeEntry(updated),
        changedAt: new Date(),
      };
      await repos.timeEntryChangeLog.insert(changeLog);

      return updated;
    },

    deleteTimeEntry: async (id: string): Promise<void> => {
      return repos.timeEntry.delete(id);
    },

    listByMatter: async (matterId: string): Promise<TimeEntry[]> => {
      return repos.timeEntry.listByMatter(matterId);
    },

    listByBill: async (billId: string): Promise<TimeEntry[]> => {
      return repos.timeEntry.listByBill(billId);
    },
  };
};

export type TimeEntryService = ReturnType<typeof TimeEntryService>;
