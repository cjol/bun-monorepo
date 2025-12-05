import Ajv from "ajv";
import type { DocumentTemplateRepository } from "@ai-starter/core";
import { badRequest } from "@hapi/boom";

export interface Deps {
  repos: {
    documentTemplate: DocumentTemplateRepository;
  };
}

const ajv = new Ajv();

const validateJsonSchema = (schemaString: string): void => {
  try {
    const schema = JSON.parse(schemaString);
    if (!ajv.validateSchema(schema)) {
      throw badRequest(`Invalid JSON Schema: ${ajv.errorsText(ajv.errors)}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("JSON")) {
      throw badRequest(`Invalid JSON in dataSchema: ${error.message}`);
    }
    throw error;
  }
};

export const DocumentTemplateService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getDocumentTemplate: repos.documentTemplate.get,
    listDocumentTemplates: repos.documentTemplate.listByMatter,

    createDocumentTemplate: async (
      data: Parameters<DocumentTemplateRepository["create"]>[0]
    ) => {
      validateJsonSchema(data.dataSchema);
      return repos.documentTemplate.create(data);
    },

    updateDocumentTemplate: async (
      id: string,
      data: Parameters<DocumentTemplateRepository["update"]>[1]
    ) => {
      if (data.dataSchema) {
        validateJsonSchema(data.dataSchema);
      }
      return repos.documentTemplate.update(id, data);
    },

    deleteDocumentTemplate: repos.documentTemplate.delete,
  };
};

export type DocumentTemplateService = ReturnType<
  typeof DocumentTemplateService
>;
