import type { Timekeeper, NewTimekeeper } from "../../schema";

export interface TimekeeperRepository {
  get(id: string): Promise<Timekeeper | null>;
  getByEmail(email: string): Promise<Timekeeper | null>;
  listAll(): Promise<Timekeeper[]>;
  create(data: NewTimekeeper): Promise<Timekeeper>;
  update(id: string, data: Partial<NewTimekeeper>): Promise<Timekeeper>;
  delete(id: string): Promise<void>;
}
