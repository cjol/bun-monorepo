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
  new Elysia({
    prefix: "/matters/:matterId/time-entries",
    tags: ["time-entry"],
  })
    .get(
      "/:timeEntryId",
      async ({ params, status }) => {
        const result = await app.timeEntry.getTimeEntry(params.timeEntryId);
        if (!result || result.matterId !== params.matterId) {
          throw notFound(
            `Time entry with ID ${params.timeEntryId} not found in matter ${params.matterId}`
          );
        }
        const jobs = await app.timeEntry.getTimeEntryJobs(params.timeEntryId);
        return status(200, { ...result, jobs });
      },
      {
        params: matterTimeEntryParamsSchema,
        detail: {
          summary: "Get Time Entry",
          description:
            "Retrieve a single time entry by ID within a matter, including related jobs.",
        },
      }
    )
    .get(
      "/",
      async ({ params, query, status }) => {
        let entries;
        if (query.billId) {
          entries = await app.timeEntry.listByBill(
            params.matterId,
            query.billId
          );
        } else {
          entries = await app.timeEntry.listByMatter(params.matterId);
        }

        // Enrich each entry with related jobs
        const enrichedEntries = await Promise.all(
          entries.map(async (entry) => {
            const jobs = await app.timeEntry.getTimeEntryJobs(entry.id);
            return { ...entry, jobs };
          })
        );

        return status(200, enrichedEntries);
      },
      {
        params: matterIdParamsSchema,
        query: timeEntryQuerySchema,
        detail: {
          summary: "List Time Entries",
          description:
            "Retrieve a list of all time entries for a matter, optionally filtered by bill. Each entry includes related jobs.",
        },
      }
    )
    .post(
      "/",
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
        detail: {
          summary: "Create Time Entry",
          description: "Create a new time entry for a matter.",
        },
      }
    )
    .patch(
      "/:timeEntryId",
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
        detail: {
          summary: "Update Time Entry",
          description: "Update an existing time entry within a matter.",
        },
      }
    );
