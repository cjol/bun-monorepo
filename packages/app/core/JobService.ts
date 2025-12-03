import { type JobRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    job: JobRepository;
  };
}

export const JobService = (deps: Deps) => {
  const { repos } = deps;

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
      return repos.job.update(id, {
        status: "completed",
        result,
        finishedAt: new Date(),
      });
    },

    /**
     * Fail a job with an error.
     */
    failJob: async (id: string, error: Record<string, unknown>) => {
      return repos.job.update(id, {
        status: "failed",
        result: error,
        finishedAt: new Date(),
      });
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
