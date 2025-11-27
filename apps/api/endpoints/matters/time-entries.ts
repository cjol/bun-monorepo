import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../../context";
import {
  newTimeEntryInputSchema,
  updateTimeEntryInputSchema,
} from "@ai-starter/core/schema/timeEntry";

const matterTimeEntryParamsSchema = t.Object({
  matterId: t.String(),
  timeEntryId: t.String(),
});

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

const timeEntryQuerySchema = t.Object({
  billId: t.Optional(t.String()),
});

export const matterTimeEntryRoutes = ({ app }: Context) =>
  new Elysia()
    .get(
      "/matters/:matterId/time-entries/:timeEntryId",
      async ({ params, status }) => {
        const result = await app.timeEntry.getTimeEntry(params.timeEntryId);
        if (!result || result.matterId !== params.matterId) {
          throw notFound(
            `Time entry with ID ${params.timeEntryId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      { params: matterTimeEntryParamsSchema }
    )
    .get(
      "/matters/:matterId/time-entries",
      async ({ params, query, status }) => {
        if (query.billId) {
          const result = await app.timeEntry.listByBill(
            params.matterId,
            query.billId
          );
          return status(200, result);
        }
        const result = await app.timeEntry.listByMatter(params.matterId);
        return status(200, result);
      },
      { params: matterIdParamsSchema, query: timeEntryQuerySchema }
    )
    .post(
      "/matters/:matterId/time-entries",
      async ({ params, body, status }) => {
        // Ensure the matterId in the body matches the URL
        const result = await app.timeEntry.createTimeEntry({
          ...body,
          matterId: params.matterId,
          date: new Date(body.date),
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: newTimeEntryInputSchema.omit({ matterId: true }),
      }
    )
    .patch(
      "/matters/:matterId/time-entries/:timeEntryId",
      async ({ params, body, status }) => {
        // Verify the time entry belongs to the matter before updating
        const existing = await app.timeEntry.getTimeEntry(params.timeEntryId);
        if (!existing || existing.matterId !== params.matterId) {
          throw notFound(
            `Time entry with ID ${params.timeEntryId} not found in matter ${params.matterId}`
          );
        }
        const { date, ...rest } = body;
        const result = await app.timeEntry.updateTimeEntry(params.timeEntryId, {
          ...rest,
          ...(date ? { date: new Date(date) } : {}),
        });
        return status(200, result);
      },
      {
        params: matterTimeEntryParamsSchema,
        body: updateTimeEntryInputSchema.omit({ id: true, matterId: true }),
      }
    );
