import { Elysia, t } from "elysia";
import type { Context } from "../context";

const idParamsSchema = t.Object({
  id: t.String(),
});

const aiSuggestionBodySchema = t.Object({
  timeEntryId: t.String({ minLength: 1 }),
  suggestedChanges: t.Object({
    matterId: t.String({ minLength: 1 }),
    timekeeperId: t.String({ minLength: 1 }),
    billId: t.Union([t.String(), t.Null()]),
    date: t.String(),
    hours: t.Number({ minimum: 0 }),
    description: t.String({ minLength: 1 }),
  }),
});

const aiSuggestionQuerySchema = t.Object({
  matterId: t.Optional(t.String()),
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
        if (query.matterId && query.status) {
          const suggestions = await app.aiSuggestion.listByStatus(
            query.matterId,
            query.status
          );
          return status(200, suggestions);
        }
        if (query.matterId) {
          const suggestions = await app.aiSuggestion.listByMatter(
            query.matterId
          );
          return status(200, suggestions);
        }
        return status(400, {
          error:
            "timeEntryId, or (matterId and status), or matterId query parameter is required",
        });
      },
      { query: aiSuggestionQuerySchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.aiSuggestion.createSuggestion({
          timeEntryId: body.timeEntryId,
          suggestedChanges: {
            matterId: body.suggestedChanges.matterId,
            timekeeperId: body.suggestedChanges.timekeeperId,
            billId: body.suggestedChanges.billId,
            date: new Date(body.suggestedChanges.date),
            hours: body.suggestedChanges.hours,
            description: body.suggestedChanges.description,
          },
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
