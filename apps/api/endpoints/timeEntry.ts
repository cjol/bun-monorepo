import { Elysia, t } from "elysia";
import type { Context } from "../context";
import { notFound } from "@hapi/boom";

const idParamsSchema = t.Object({
  id: t.String(),
});

const timeEntryBodySchema = t.Object({
  matterId: t.String({ minLength: 1 }),
  timekeeperId: t.String({ minLength: 1 }),
  billId: t.Union([t.String(), t.Null()]),
  date: t.String(),
  hours: t.Number({ minimum: 0 }),
  description: t.String({ minLength: 1 }),
});

const timeEntryPatchSchema = t.Partial(timeEntryBodySchema);

const timeEntryQuerySchema = t.Object({
  matterId: t.Optional(t.String()),
  billId: t.Optional(t.String()),
});

export const timeEntryRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/time-entries" })
    .get(
      "/",
      async ({ query, status }) => {
        if (query.matterId && query.billId) {
          const entries = await app.timeEntry.listByBill(
            query.matterId,
            query.billId
          );
          return status(200, entries);
        }
        if (query.matterId) {
          const entries = await app.timeEntry.listByMatter(query.matterId);
          return status(200, entries);
        }
        return status(400, {
          error: "matterId query parameter is required (billId is optional)",
        });
      },
      { query: timeEntryQuerySchema }
    )
    .get(
      "/:id",
      async ({ params, status }) => {
        const result = await app.timeEntry.getTimeEntry(params.id);
        if (!result) {
          throw notFound(`TimeEntry with ID ${params.id} not found`);
        }
        return status(200, result);
      },
      { params: idParamsSchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.timeEntry.createTimeEntry({
          matterId: body.matterId,
          timekeeperId: body.timekeeperId,
          billId: body.billId,
          date: new Date(body.date),
          hours: body.hours,
          description: body.description,
        });
        return status(201, result);
      },
      { body: timeEntryBodySchema }
    )
    .patch(
      "/:id",
      async ({ params, body, status }) => {
        try {
          const result = await app.timeEntry.updateTimeEntry(params.id, {
            matterId: body.matterId,
            timekeeperId: body.timekeeperId,
            billId: body.billId,
            date: body.date ? new Date(body.date) : undefined,
            hours: body.hours,
            description: body.description,
          });
          return status(200, result);
        } catch (error) {
          if (error instanceof Error && error.message.includes("not found")) {
            throw notFound(error.message);
          }
          throw error;
        }
      },
      { params: idParamsSchema, body: timeEntryPatchSchema }
    )
    .delete(
      "/:id",
      async ({ params, status }) => {
        const timeEntry = await app.timeEntry.getTimeEntry(params.id);
        if (!timeEntry) {
          throw notFound(`TimeEntry with ID ${params.id} not found`);
        }
        await app.timeEntry.deleteTimeEntry(params.id);
        return status(204);
      },
      { params: idParamsSchema }
    );
