import { type ActivityLogRepository } from "@ai-starter/core/ports/repositories";

export interface Deps {
  repos: {
    activityLog: ActivityLogRepository;
  };
}

export const ActivityLogService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getActivityLog: repos.activityLog.get,
    createActivityLog: repos.activityLog.create,
    updateActivityLog: repos.activityLog.update,
    deleteActivityLog: repos.activityLog.delete,
    listActivityLogs: repos.activityLog.list,
    listEntitiesByActivityLog: repos.activityLog.listEntitiesByActivityLog,

    /**
     * Get all activities for a specific entity (e.g., time entry).
     */
    listByEntity: async (entityType: string, entityId: string) => {
      return repos.activityLog.listByEntity(entityType, entityId);
    },

    /**
     * Create an agent job activity log entry.
     * This should be called whenever an agent job is created.
     */
    createAgentJobActivity: async (
      name: string,
      parameters: { prompt: string; matterId: string; workflowId: string },
      jobId: string,
      entities?: { entityType: string; entityId: string }[]
    ) => {
      return repos.activityLog.create(
        {
          name,
          type: "agent_job",
          parameters,
          jobId,
        },
        entities
      );
    },

    /**
     * Create a reviewing email activity log entry.
     * This should be called when an agent sends an email requesting information.
     */
    createReviewingEmailActivity: async (
      name: string,
      parameters: {
        to: string;
        subject: string;
        body: string;
        messageId: string;
        timestamp: string;
      },
      timeEntryIds: string[],
      assignedTo?: string
    ) => {
      const entities = timeEntryIds.map((entityId) => ({
        entityType: "time_entry" as const,
        entityId,
      }));

      return repos.activityLog.create(
        {
          name,
          type: "reviewing_email",
          parameters,
          assignedTo,
        },
        entities
      );
    },

    /**
     * Sync an agent job activity when the job status changes.
     * This copies the job status and result to the activity log.
     */
    syncAgentJobActivity: async (
      jobId: string,
      updates: {
        status?: "pending" | "running" | "completed" | "failed";
        result?: unknown;
        startedAt?: Date;
        finishedAt?: Date;
      }
    ) => {
      // Find the activity log linked to this job
      const activities = await repos.activityLog.list();
      const agentJobActivity = activities.find(
        (activity) => activity.type === "agent_job" && activity.jobId === jobId
      );

      if (!agentJobActivity) {
        throw new Error(`No agent job activity found for job ${jobId}`);
      }

      return repos.activityLog.update(agentJobActivity.id, updates);
    },

    /**
     * Update a reviewing email activity status.
     * Used when an email response is received.
     */
    updateReviewingEmailActivity: async (
      activityId: string,
      status: "completed" | "failed",
      result?: unknown
    ) => {
      return repos.activityLog.update(activityId, {
        status,
        result,
        finishedAt: new Date(),
      });
    },
  };
};

export type ActivityLogService = ReturnType<typeof ActivityLogService>;
