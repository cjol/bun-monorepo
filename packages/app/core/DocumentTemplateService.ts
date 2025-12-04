import type { DocumentTemplateRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    documentTemplate: DocumentTemplateRepository;
  };
}

export const DocumentTemplateService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getDocumentTemplate: repos.documentTemplate.get,
    listDocumentTemplates: repos.documentTemplate.listAll,
    createDocumentTemplate: repos.documentTemplate.create,
    updateDocumentTemplate: repos.documentTemplate.update,
    deleteDocumentTemplate: repos.documentTemplate.delete,
  };
};

export type DocumentTemplateService = ReturnType<
  typeof DocumentTemplateService
>;
