import type { Document, NewDocument } from "../../schema";

export interface DocumentRepository {
  get(id: string): Promise<Document | null>;
  listByMatter(matterId: string): Promise<Document[]>;
  listByBill(billId: string): Promise<Document[]>;
  create(data: NewDocument): Promise<Document>;
  delete(id: string): Promise<void>;
}
