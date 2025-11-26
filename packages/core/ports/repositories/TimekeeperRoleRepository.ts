import type { TimekeeperRole, NewTimekeeperRole } from "../../schema";

export interface TimekeeperRoleRepository {
  get(id: string): Promise<TimekeeperRole | null>;
  listByMatter(matterId: string): Promise<TimekeeperRole[]>;
  listByTimekeeper(timekeeperId: string): Promise<TimekeeperRole[]>;
  create(data: NewTimekeeperRole): Promise<TimekeeperRole>;
  update(id: string, data: Partial<NewTimekeeperRole>): Promise<TimekeeperRole>;
  delete(id: string): Promise<void>;
}
