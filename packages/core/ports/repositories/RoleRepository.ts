import type { Role, NewRole } from "../../schema";

export interface RoleRepository {
  get(id: string): Promise<Role | null>;
  list(): Promise<Role[]>;
  create(data: NewRole): Promise<Role>;
  update(id: string, data: Partial<NewRole>): Promise<Role>;
  delete(id: string): Promise<void>;
}
