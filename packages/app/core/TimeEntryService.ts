import {
  type TimeEntryRepository,
  type TimeEntryChangeLogRepository,
  type TimekeeperRoleRepository,
  type TimeEntry,
  type NewTimeEntry,
} from "@ai-starter/core";
import { badRequest } from "@hapi/boom";
import type { WorkflowService as WorkflowServiceType } from "./WorkflowService";
import type { JobService as JobServiceType } from "./JobService";

export interface Deps {
  repos: {
    timeEntry: TimeEntryRepository;
    timeEntryChangeLog: TimeEntryChangeLogRepository;
    timekeeperRole: TimekeeperRoleRepository;
  };
  services: {
    workflow: WorkflowServiceType;
    job: JobServiceType;
  };
}

export const TimeEntryService = (deps: Deps) => {
  const { repos, services } = deps;

  return {
    getTimeEntry: repos.timeEntry.get,
    listByMatter: repos.timeEntry.listByMatter,
    listByBill: repos.timeEntry.listByMatterAndBill,

    /**
     * Get all jobs associated with a time entry.
     */
    getTimeEntryJobs: async (timeEntryId: string) => {
      if (!services?.job) {
        return [];
      }
      const jobService = services.job;
      const jobEntities = await jobService.listJobsByEntity(
        "time_entry",
        timeEntryId
      );
      // Hydrate with full job objects
      const jobs = await Promise.all(
        jobEntities.map((je) => jobService.getJob(je.jobId))
      );
      return jobs.filter((job) => job !== undefined);
    },

    createTimeEntries: async (
      matterId: string,
      data: NewTimeEntry[],
      batchSize = 20
    ): Promise<TimeEntry[]> => {
      if (data.length === 0) return [];

      // Validate all entries are for the same matter
      for (const entry of data) {
        if (entry.matterId !== matterId) {
          throw badRequest(
            `All time entries must be for matter ${matterId}, but found entry for matter ${entry.matterId}`
          );
        }
      }

      // Prefetch all timekeeper roles for the matter to validate in-memory
      const allTimekeeperRoles =
        await repos.timekeeperRole.listByMatter(matterId);

      // Create a lookup map for validation
      const roleLookup = new Map<string, boolean>();
      for (const role of allTimekeeperRoles) {
        roleLookup.set(role.timekeeperId, true);
      }

      // Validate all entries have timekeepers with roles in the matter
      for (const entry of data) {
        if (!roleLookup.has(entry.timekeeperId)) {
          throw badRequest(
            `Timekeeper ${entry.timekeeperId} does not have a role within matter ${matterId}`
          );
        }
      }

      // Create all time entries in a batch
      const created: TimeEntry[] = await repos.timeEntry.createMany(data);

      // Create change log entries in a batch
      const changeLogData = created.map((entry) => ({
        timeEntryId: entry.id,
        beforeData: null,
        afterData: entry,
      }));
      await repos.timeEntryChangeLog.insertMany(changeLogData);

      // Enqueue jobs for triggered workflows (split into sub-batches)

      try {
        const workflows = await services.workflow.listByTrigger(
          matterId,
          "time_entry:batch_created"
        );

        // Split entries into sub-batches
        for (let i = 0; i < created.length; i += batchSize) {
          const subBatch = created.slice(i, i + batchSize);

          for (const workflow of workflows) {
            const timeEntriesJson = JSON.stringify(subBatch, null, 2);
            const prompt = `${subBatch.length} new time entr${subBatch.length === 1 ? "y has" : "ies have"} been created for matter ${matterId}.

Time entries:
${timeEntriesJson}

Please process these time entries according to the workflow instructions.`;

            await services.job.createJob(
              {
                name: workflow.name,
                type: "agent",
                parameters: {
                  prompt,
                  matterId,
                  workflowId: workflow.id,
                },
              },
              subBatch.map((entry: TimeEntry) => ({
                entityType: "time_entry",
                entityId: entry.id,
              }))
            );
          }
        }
      } catch (error: unknown) {
        console.error(
          "Error enqueueing workflow jobs for time entries:",
          error instanceof Error ? error.message : String(error)
        );
      }

      return created;
    },
    updateTimeEntry: async (
      id: string,
      data: Partial<NewTimeEntry>,
      reason?: string
    ): Promise<TimeEntry> => {
      // Get the existing entry for the changelog
      const existing = await repos.timeEntry.get(id);
      if (!existing) {
        throw new Error(`TimeEntry with id ${id} not found`);
      }

      // If either matterId or timekeeperId is being changed, validate the combination
      if (data.matterId !== undefined || data.timekeeperId !== undefined) {
        const targetMatterId = data.matterId ?? existing.matterId;
        const targetTimekeeperId = data.timekeeperId ?? existing.timekeeperId;

        const timekeeperRole =
          await repos.timekeeperRole.findByTimekeeperAndMatter(
            targetTimekeeperId,
            targetMatterId
          );

        if (!timekeeperRole) {
          throw badRequest(
            `Timekeeper ${targetTimekeeperId} does not have a role within matter ${targetMatterId}`
          );
        }
      }

      const updated = await repos.timeEntry.update(id, {
        ...data,
      });

      // Log the update
      await repos.timeEntryChangeLog.insert({
        timeEntryId: updated.id,
        beforeData: existing,
        afterData: updated,
        reason,
      });

      return updated;
    },
  };
};

export type TimeEntryService = ReturnType<typeof TimeEntryService>;
