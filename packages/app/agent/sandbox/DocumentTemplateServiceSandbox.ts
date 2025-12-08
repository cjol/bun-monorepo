import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { DocumentTemplateService } from "../../core/DocumentTemplateService";
import { newDocumentTemplateInputSchema } from "@ai-starter/core/schema/documentTemplate";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for DocumentTemplateService.
 * These functions are used by the general-purpose agent to interact with document templates.
 */
export function createDocumentTemplateSandboxFunctions(
  service: DocumentTemplateService
) {
  const listDocumentTemplates = defineSandboxFunction({
    description: "List all document templates for a specific matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of matter to list templates for"),
    }),
    execute: async ({ matterId }) => {
      return service.listDocumentTemplates(matterId);
    },
  });

  const getDocumentTemplate = defineSandboxFunction({
    description: "Fetch a specific document template by ID",
    inputSchema: z.object({
      templateId: ulidSchema.describe("The ULID of document template to fetch"),
    }),
    execute: async ({ templateId }) => {
      const template = await service.getDocumentTemplate(templateId);
      if (!template) {
        throw new Error(`Document template with ID ${templateId} not found`);
      }
      return template;
    },
  });

  const createDocumentTemplate = defineSandboxFunction({
    description: "Create a new document template",
    inputSchema: newDocumentTemplateInputSchema,
    execute: async ({
      matterId,
      name,
      description,
      outputFormat,
      dataSchema,
      templateCode,
    }) => {
      return service.createDocumentTemplate({
        matterId,
        name,
        description,
        outputFormat,
        dataSchema,
        templateCode,
      });
    },
  });

  const updateDocumentTemplate = defineSandboxFunction({
    description: "Update an existing document template",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of document template to update"),
      data: z.object({
        name: z.string().optional().describe("Updated name of the template"),
        description: z
          .string()
          .nullable()
          .optional()
          .describe("Updated description of the template"),
        outputFormat: z
          .enum(["csv", "xlsx", "html", "json", "text"])
          .optional()
          .describe("Updated output format"),
        dataSchema: z
          .string()
          .optional()
          .describe("Updated JSON schema string"),
        templateCode: z.string().optional().describe("Updated template code"),
      }),
    }),
    execute: async ({ id, data }) => {
      return service.updateDocumentTemplate(id, data);
    },
  });

  const deleteDocumentTemplate = defineSandboxFunction({
    description: "Delete a document template",
    inputSchema: z.object({
      templateId: ulidSchema.describe(
        "The ULID of document template to delete"
      ),
    }),
    execute: async ({ templateId }) => {
      await service.deleteDocumentTemplate(templateId);
      return {
        success: true,
        message: `Document template ${templateId} deleted successfully`,
      };
    },
  });

  return {
    listDocumentTemplates,
    getDocumentTemplate,
    createDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
  };
}
