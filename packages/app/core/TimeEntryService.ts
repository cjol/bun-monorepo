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
  services?: {
    workflow?: WorkflowServiceType;
    job?: JobServiceType;
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

    createTimeEntry: async (data: NewTimeEntry): Promise<TimeEntry> => {
      // Validate that the timekeeper has a role within the matter
      const timekeeperRole =
        await repos.timekeeperRole.findByTimekeeperAndMatter(
          data.timekeeperId,
          data.matterId
        );

      if (!timekeeperRole) {
        throw badRequest(
          `Timekeeper ${data.timekeeperId} does not have a role within matter ${data.matterId}`
        );
      }

      const created: TimeEntry = await repos.timeEntry.create(data);

      await repos.timeEntryChangeLog.insert({
        timeEntryId: created.id,
        beforeData: null,
        afterData: created,
      });

      // Enqueue jobs for triggered workflows
      if (services?.workflow && services?.job) {
        const { workflow: workflowService, job: jobService } = services;
        await workflowService
          .listByTrigger(data.matterId, "time_entry:batch_created")
          .then(async (workflows) => {
            for (const workflow of workflows) {
              const timeEntriesJson = JSON.stringify([created], null, 2);
              const prompt = `A new time entry has been created for matter ${data.matterId}.

Time entries:
${timeEntriesJson}

Please process these time entries according to the workflow instructions.`;

              await jobService.createJob(
                {
                  type: "agent",
                  parameters: {
                    prompt,
                    matterId: data.matterId,
                    workflowId: workflow.id,
                  },
                },
                [
                  {
                    entityType: "time_entry",
                    entityId: created.id,
                  },
                ]
              );
            }
          })
          .catch((error: Error) => {
            console.error(
              "Error enqueueing workflow jobs for time entry:",
              error.message
            );
          });
      }

      return created;
    },

    updateTimeEntry: async (
      id: string,
      data: Partial<NewTimeEntry>
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
      });

      return updated;
    },
  };
};

export type TimeEntryService = ReturnType<typeof TimeEntryService>;
