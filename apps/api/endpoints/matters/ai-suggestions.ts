import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../../context";
import { newAiSuggestionInputSchema } from "@ai-starter/core/schema/aiSuggestion";

const matterSuggestionParamsSchema = t.Object({
  matterId: t.String(),
  suggestionId: t.String(),
});

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

const suggestionQuerySchema = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal("pending"),
      t.Literal("approved"),
      t.Literal("rejected"),
    ])
  ),
});

export const matterAiSuggestionRoutes = ({ app }: Context) =>
  new Elysia({
    prefix: "/matters/:matterId/suggestions",
    tags: ["suggestion"],
  })
    .get(
      "/:suggestionId",
      async ({ params, status }) => {
        const suggestion = await app.aiSuggestion.listByMatter(params.matterId);
        const result = suggestion.find((s) => s.id === params.suggestionId);
        if (!result) {
          throw notFound(
            `AI suggestion with ID ${params.suggestionId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      {
        params: matterSuggestionParamsSchema,
        detail: {
          summary: "Get AI Suggestion",
          description: "Retrieve a single AI suggestion by ID within a matter.",
        },
      }
    )
    .get(
      "/",
      async ({ params, query, status }) => {
        if (query.status) {
          const result = await app.aiSuggestion.listByStatus(
            params.matterId,
            query.status
          );
          return status(200, result);
        }
        const result = await app.aiSuggestion.listByMatter(params.matterId);
        return status(200, result);
      },
      {
        params: matterIdParamsSchema,
        query: suggestionQuerySchema,
        detail: {
          summary: "List AI Suggestions",
          description:
            "Retrieve a list of all AI suggestions for a matter, optionally filtered by status.",
        },
      }
    )
    .post(
      "/",
      async ({ params, body, status }) => {
        // Verify the time entry belongs to the matter
        const timeEntry = await app.timeEntry.getTimeEntry(body.timeEntryId);
        if (!timeEntry || timeEntry.matterId !== params.matterId) {
          throw notFound(
            `Time entry with ID ${body.timeEntryId} not found in matter ${params.matterId}`
          );
        }
        const result = await app.aiSuggestion.createSuggestion({
          ...body,
          suggestedChanges: {
            ...body.suggestedChanges,
            date: new Date(body.suggestedChanges.date),
          },
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: newAiSuggestionInputSchema,
        detail: {
          summary: "Create AI Suggestion",
          description:
            "Create a new AI suggestion for a time entry within a matter.",
        },
      }
    )
    .post(
      "/:suggestionId/approve",
      async ({ params, status }) => {
        const result = await app.aiSuggestion.approveSuggestion(
          params.suggestionId
        );
        // Verify it belongs to the matter
        const timeEntry = await app.timeEntry.getTimeEntry(result.timeEntryId);
        if (!timeEntry || timeEntry.matterId !== params.matterId) {
          throw notFound(
            `AI suggestion with ID ${params.suggestionId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      {
        params: matterSuggestionParamsSchema,
        detail: {
          summary: "Approve AI Suggestion",
          description:
            "Approve an AI suggestion, applying its changes to the associated time entry.",
        },
      }
    )
    .post(
      "/:suggestionId/reject",
      async ({ params, status }) => {
        const result = await app.aiSuggestion.rejectSuggestion(
          params.suggestionId
        );
        // Verify it belongs to the matter
        const timeEntry = await app.timeEntry.getTimeEntry(result.timeEntryId);
        if (!timeEntry || timeEntry.matterId !== params.matterId) {
          throw notFound(
            `AI suggestion with ID ${params.suggestionId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      {
        params: matterSuggestionParamsSchema,
        detail: {
          summary: "Reject AI Suggestion",
          description:
            "Reject an AI suggestion, marking it as rejected without applying changes.",
        },
      }
    );
