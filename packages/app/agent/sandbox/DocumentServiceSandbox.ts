import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { DocumentService } from "../../core/DocumentService";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for DocumentService.
 * These functions are used by the general-purpose agent to interact with documents.
 */
export function createDocumentSandboxFunctions(service: DocumentService) {
  const listDocumentsByMatter = defineSandboxFunction({
    description: "List all documents for a specific matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe(
        "The ULID of the matter to list documents for"
      ),
    }),
    execute: async ({ matterId }) => {
      return service.listByMatter(matterId);
    },
  });

  const getDocument = defineSandboxFunction({
    description: "Fetch a specific document by ID",
    inputSchema: z.object({
      documentId: ulidSchema.describe("The ULID of the document to fetch"),
    }),
    execute: async ({ documentId }) => {
      const document = await service.getDocument(documentId);
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }
      return document;
    },
  });

  const generateDocument = defineSandboxFunction({
    description: "Generate a new document from a template",
    inputSchema: z.object({
      matterId: ulidSchema.describe(
        "The ULID of the matter to associate the document with"
      ),
      templateId: ulidSchema.describe(
        "The ULID of the template to use for generation"
      ),
      data: z
        .unknown()
        .describe("Data to pass to the template (must match template schema)"),
      name: z.string().describe("Name for the generated document"),
    }),
    execute: async ({ matterId, templateId, data, name }) => {
      return service.generateFromTemplate({
        matterId,
        templateId,
        data,
        name,
        generatedBy: "agent",
      });
    },
  });

  const createAdHocDocument = defineSandboxFunction({
    description: "Create an ad-hoc document from direct content",
    inputSchema: z.object({
      matterId: ulidSchema.describe(
        "The ULID of the matter to associate the document with"
      ),
      name: z.string().describe("Name for the document"),
      content: z.string().describe("The content of the document"),
      mimeType: z
        .string()
        .describe("MIME type of the content (e.g., 'text/html', 'text/plain')"),
    }),
    execute: async ({ matterId, name, content, mimeType }) => {
      return service.createAdHocDocument({
        matterId,
        name,
        content,
        mimeType,
        generatedBy: "agent",
      });
    },
  });

  const deleteDocument = defineSandboxFunction({
    description: "Delete a document and its associated file",
    inputSchema: z.object({
      documentId: ulidSchema.describe("The ULID of the document to delete"),
    }),
    execute: async ({ documentId }) => {
      await service.deleteDocument(documentId);
      return {
        success: true,
        message: `Document ${documentId} deleted successfully`,
      };
    },
  });

  return {
    listDocumentsByMatter,
    getDocument,
    generateDocument,
    createAdHocDocument,
    deleteDocument,
  };
}
