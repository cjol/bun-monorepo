import type { Job, NewJob } from "../../schema/job";

export interface JobRepository {
  get(id: string): Promise<Job | undefined>;
  create(job: NewJob): Promise<Job>;
  update(id: string, updates: Partial<NewJob>): Promise<Job>;
  delete(id: string): Promise<void>;
  list(): Promise<Job[]>;
  listPending(): Promise<Job[]>;
  claimNext(): Promise<Job | undefined>;
}
