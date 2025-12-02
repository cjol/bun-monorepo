import type { TimekeeperRole, NewTimekeeperRole } from "../../schema";

export interface TimekeeperRoleRepository {
  get(id: string): Promise<TimekeeperRole | null>;
  listByMatter(matterId: string): Promise<TimekeeperRole[]>;
  listByTimekeeper(timekeeperId: string): Promise<TimekeeperRole[]>;
  findByTimekeeperAndMatter(
    timekeeperId: string,
    matterId: string
  ): Promise<TimekeeperRole | null>;
  create(data: NewTimekeeperRole): Promise<TimekeeperRole>;
  update(id: string, data: Partial<NewTimekeeperRole>): Promise<TimekeeperRole>;
  delete(id: string): Promise<void>;
}
