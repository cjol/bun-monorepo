import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";
import type { Context } from "../../context";
import {
  newDocumentTemplateInputSchema,
  updateDocumentTemplateInputSchema,
} from "@ai-starter/core/schema/documentTemplate";

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

const templateIdParamsSchema = t.Object({
  templateId: t.String(),
});

export const matterDocumentTemplateRoutes = ({ app }: Context) =>
  new Elysia({
    prefix: "/matters/:matterId/document-templates",
    tags: ["document-template"],
  })
    .get(
      "/",
      async ({ params, status }) => {
        const result = await app.documentTemplate.listDocumentTemplates(
          params.matterId
        );
        return status(200, result);
      },
      {
        params: matterIdParamsSchema,
        detail: {
          summary: "List Document Templates",
          description: "Get all document templates for a specific matter",
        },
      }
    )
    .get(
      "/:templateId",
      async ({ params, status }) => {
        const result = await app.documentTemplate.getDocumentTemplate(
          params.templateId
        );
        if (!result)
          throw notFound(
            `Document template with ID ${params.templateId} not found`
          );
        return status(200, result);
      },
      {
        params: templateIdParamsSchema,
        detail: {
          summary: "Get Document Template",
          description: "Get a specific document template by ID",
        },
      }
    )
    .post(
      "/",
      async ({ params, body, status }) => {
        const result = await app.documentTemplate.createDocumentTemplate({
          ...body,
          matterId: params.matterId,
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: newDocumentTemplateInputSchema.omit({ matterId: true }),
        detail: {
          summary: "Create Document Template",
          description: "Create a new document template for a specific matter",
        },
      }
    )
    .patch(
      "/:templateId",
      async ({ params, body, status }) => {
        const result = await app.documentTemplate.updateDocumentTemplate(
          params.templateId,
          body
        );
        return status(200, result);
      },
      {
        params: templateIdParamsSchema,
        body: updateDocumentTemplateInputSchema.omit({
          id: true,
          matterId: true,
        }),
        detail: {
          summary: "Update Document Template",
          description: "Update an existing document template",
        },
      }
    )
    .delete(
      "/:templateId",
      async ({ params, status }) => {
        await app.documentTemplate.deleteDocumentTemplate(params.templateId);
        return status(204);
      },
      {
        params: templateIdParamsSchema,
        detail: {
          summary: "Delete Document Template",
          description: "Delete a document template",
        },
      }
    );
