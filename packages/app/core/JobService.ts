import { type JobRepository } from "@ai-starter/core";
import type { ActivityLogService as ActivityLogServiceType } from "./ActivityLogService";

export interface Deps {
  repos: {
    job: JobRepository;
  };
  services?: {
    activityLog?: ActivityLogServiceType;
  };
}

export const JobService = (deps: Deps) => {
  const { repos, services } = deps;

  return {
    getJob: repos.job.get,
    createJob: repos.job.create,
    updateJob: repos.job.update,
    deleteJob: repos.job.delete,
    listJobs: repos.job.list,
    listPendingJobs: repos.job.listPending,
    claimNextJob: repos.job.claimNext,

    /**
     * Complete a job with a successful result.
     */
    completeJob: async (id: string, result: Record<string, unknown>) => {
      const updatedJob = await repos.job.update(id, {
        status: "completed",
        result,
        finishedAt: new Date(),
      });

      // Sync activity log if service is available
      if (services?.activityLog) {
        try {
          await services.activityLog.syncAgentJobActivity(id, {
            status: "completed",
            result,
            finishedAt: new Date(),
          });
        } catch (error) {
          console.error(
            "Failed to sync activity log for completed job:",
            error
          );
        }
      }

      return updatedJob;
    },

    /**
     * Fail a job with an error.
     */
    failJob: async (id: string, error: Record<string, unknown>) => {
      const updatedJob = await repos.job.update(id, {
        status: "failed",
        result: error,
        finishedAt: new Date(),
      });

      // Sync activity log if service is available
      if (services?.activityLog) {
        try {
          await services.activityLog.syncAgentJobActivity(id, {
            status: "failed",
            result: error,
            finishedAt: new Date(),
          });
        } catch (syncError) {
          console.error(
            "Failed to sync activity log for failed job:",
            syncError
          );
        }
      }

      return updatedJob;
    },

    /**
     * Get all entities linked to a job.
     */
    listEntitiesByJob: repos.job.listEntitiesByJob,

    /**
     * Get all jobs linked to an entity.
     */
    listJobsByEntity: repos.job.listJobsByEntity,
  };
};

export type JobService = ReturnType<typeof JobService>;
