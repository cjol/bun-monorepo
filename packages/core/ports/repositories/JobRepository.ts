import type { Job, NewJob } from "../../schema/job";
import type { JobEntity } from "../../schema/jobEntity";

export interface JobRepository {
  get(id: string): Promise<Job | undefined>;
  create(
    job: NewJob,
    entities?: { entityType: string; entityId: string }[]
  ): Promise<Job>;
  update(id: string, updates: Partial<NewJob>): Promise<Job>;
  delete(id: string): Promise<void>;
  list(): Promise<Job[]>;
  listPending(): Promise<Job[]>;
  claimNext(): Promise<Job | undefined>;

  // Entity linking methods
  listEntitiesByJob(jobId: string): Promise<JobEntity[]>;
  listJobsByEntity(entityType: string, entityId: string): Promise<JobEntity[]>;
}
