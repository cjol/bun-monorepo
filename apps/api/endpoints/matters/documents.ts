import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";
import type { Context } from "../../context";

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

const documentIdParamsSchema = t.Object({
  documentId: t.String(),
});

const generateDocumentSchema = t.Object({
  templateId: t.String({ description: "ID of the template to use" }),
  data: t.Unknown({ description: "Data to pass to the template" }),
  name: t.String({ description: "Name for the generated document" }),
});

export const matterDocumentRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/matters/:matterId/documents", tags: ["document"] })
    .get(
      "/",
      async ({ params, status }) => {
        const result = await app.document.listByMatter(params.matterId);
        return status(200, result);
      },
      {
        params: matterIdParamsSchema,
        detail: {
          summary: "List Documents",
          description: "Get all documents for a specific matter",
        },
      }
    )
    .get(
      "/:documentId",
      async ({ params, status }) => {
        const result = await app.document.getDocument(params.documentId);
        if (!result)
          throw notFound(`Document with ID ${params.documentId} not found`);
        return status(200, result);
      },
      {
        params: documentIdParamsSchema,
        detail: {
          summary: "Get Document",
          description: "Get a specific document by ID",
        },
      }
    )
    .get(
      "/:documentId/download",
      async ({ params }) => {
        const document = await app.document.getDocument(params.documentId);
        if (!document)
          throw notFound(`Document with ID ${params.documentId} not found`);

        const content = await app.document.getDocumentContent(
          params.documentId
        );

        // I'm unhappy with this cast but I think it's because Bun handles stuff that the base Response type can't
        return new Response(content as unknown as ArrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": document.mimeType,
            "Content-Disposition": `attachment; filename="${document.name}"`,
            "Content-Length": document.fileSize.toString(),
          },
        });
      },
      {
        params: documentIdParamsSchema,
        detail: {
          summary: "Download Document",
          description: "Download the actual file content of a document",
        },
      }
    )
    .post(
      "/",
      async ({ params, body, status }) => {
        const result = await app.document.generateFromTemplate({
          matterId: params.matterId,
          templateId: body.templateId,
          data: body.data,
          name: body.name,
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: generateDocumentSchema,
        detail: {
          summary: "Generate Document",
          description: "Generate a new document from a template",
        },
      }
    )
    .delete(
      "/:documentId",
      async ({ params, status }) => {
        await app.document.deleteDocument(params.documentId);
        return status(204);
      },
      {
        params: documentIdParamsSchema,
        detail: {
          summary: "Delete Document",
          description: "Delete a document and its associated file",
        },
      }
    );
