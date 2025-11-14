import { Elysia, t } from "elysia";
import type { Context } from "../context";

const idParamsSchema = t.Object({
  id: t.String(),
});

const aiSuggestionBodySchema = t.Object({
  timeEntryId: t.String({ minLength: 1 }),
  messageId: t.String({ minLength: 1 }),
  suggestedChanges: t.Record(t.String(), t.Unknown()),
});

const aiSuggestionQuerySchema = t.Object({
  timeEntryId: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal("pending"),
      t.Literal("approved"),
      t.Literal("rejected"),
    ])
  ),
});

export const aiSuggestionRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/ai-suggestions" })
    .get(
      "/",
      async ({ query, status }) => {
        if (query.timeEntryId) {
          const suggestions = await app.aiSuggestion.listByTimeEntry(
            query.timeEntryId
          );
          return status(200, suggestions);
        }
        if (query.status) {
          const suggestions = await app.aiSuggestion.listByStatus(query.status);
          return status(200, suggestions);
        }
        return status(400, {
          error: "timeEntryId or status query parameter is required",
        });
      },
      { query: aiSuggestionQuerySchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.aiSuggestion.createSuggestion({
          timeEntryId: body.timeEntryId,
          messageId: body.messageId,
          suggestedChanges: body.suggestedChanges,
        });
        return status(201, result);
      },
      { body: aiSuggestionBodySchema }
    )
    .post(
      "/:id/approve",
      async ({ params, status }) => {
        const result = await app.aiSuggestion.approveSuggestion(params.id);
        return status(200, result);
      },
      { params: idParamsSchema }
    )
    .post(
      "/:id/reject",
      async ({ params, status }) => {
        const result = await app.aiSuggestion.rejectSuggestion(params.id);
        return status(200, result);
      },
      { params: idParamsSchema }
    );
