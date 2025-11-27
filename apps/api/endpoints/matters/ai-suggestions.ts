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
  new Elysia()
    .get(
      "/matters/:matterId/ai-suggestions/:suggestionId",
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
      { params: matterSuggestionParamsSchema }
    )
    .get(
      "/matters/:matterId/ai-suggestions",
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
      { params: matterIdParamsSchema, query: suggestionQuerySchema }
    )
    .post(
      "/matters/:matterId/ai-suggestions",
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
      { params: matterIdParamsSchema, body: newAiSuggestionInputSchema }
    )
    .post(
      "/matters/:matterId/ai-suggestions/:suggestionId/approve",
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
      { params: matterSuggestionParamsSchema }
    )
    .post(
      "/matters/:matterId/ai-suggestions/:suggestionId/reject",
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
      { params: matterSuggestionParamsSchema }
    );
