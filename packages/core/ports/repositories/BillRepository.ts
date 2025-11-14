import type { Bill, NewBill } from "../../schema";

export interface BillRepository {
  get(id: string): Promise<Bill | null>;
  listAll(): Promise<Bill[]>;
  listByMatter(matterId: string): Promise<Bill[]>;
  create(data: NewBill): Promise<Bill>;
  update(id: string, data: Partial<NewBill>): Promise<Bill>;
  delete(id: string): Promise<void>;
}
