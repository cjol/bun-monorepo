import type { DocumentTemplate, NewDocumentTemplate } from "../../schema";

export interface DocumentTemplateRepository {
  get(id: string): Promise<DocumentTemplate | null>;
  listAll(): Promise<DocumentTemplate[]>;
  create(data: NewDocumentTemplate): Promise<DocumentTemplate>;
  update(
    id: string,
    data: Partial<NewDocumentTemplate>
  ): Promise<DocumentTemplate>;
  delete(id: string): Promise<void>;
}
