import type { Matter, NewMatter } from "../../schema";

export interface MatterRepository {
  get(id: string): Promise<Matter | null>;
  listAll(): Promise<Matter[]>;
  create(data: NewMatter): Promise<Matter>;
  update(id: string, data: Partial<NewMatter>): Promise<Matter>;
  delete(id: string): Promise<void>;
}
