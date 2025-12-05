import type { DocumentTemplate, NewDocumentTemplate } from "../../schema";

export interface DocumentTemplateRepository {
  get(id: string): Promise<DocumentTemplate | null>;
  listByMatter(matterId: string): Promise<DocumentTemplate[]>;
  create(data: NewDocumentTemplate): Promise<DocumentTemplate>;
  update(
    id: string,
    data: Partial<NewDocumentTemplate>
  ): Promise<DocumentTemplate>;
  delete(id: string): Promise<void>;
}
