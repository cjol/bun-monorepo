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
        const activities = await app.timeEntry.getTimeEntryActivities(
          params.timeEntryId
        );
        return status(200, { ...result, activities });
      },
      {
        params: matterTimeEntryParamsSchema,
        detail: {
          summary: "Get Time Entry",
          description:
            "Retrieve a single time entry by ID within a matter, including related activities.",
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

        // Enrich each entry with related activities
        const enrichedEntries = await Promise.all(
          entries.map(async (entry) => {
            const activities = await app.timeEntry.getTimeEntryActivities(
              entry.id
            );
            return { ...entry, activities };
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
            "Retrieve a list of all time entries for a matter, optionally filtered by bill. Each entry includes related activities.",
        },
      }
    )
    .post(
      "/",
      async ({ params, body, status }) => {
        // Ensure the matterId in the body matches the URL
        const result = await app.timeEntry.createTimeEntries(params.matterId, [
          {
            ...body,
            matterId: params.matterId,
            date: new Date(body.date),
          },
        ]);
        return status(201, result[0]);
      },
      {
        params: matterIdParamsSchema,
        // TODO: validate against actual matter metadata schema
        body: newTimeEntryInputSchema().omit({ matterId: true }),
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
        body: updateTimeEntryInputSchema().omit({ id: true, matterId: true }),
        detail: {
          summary: "Update Time Entry",
          description: "Update an existing time entry within a matter.",
        },
      }
    )
    .post(
      "/import",
      async ({ params, body, status }) => {
        const csvContent = await body.file.text();

        console.log("Importing time entries CSV:", csvContent.slice(0, 100));
        const result = await app.timeEntryImport.importTimeEntries(
          params.matterId,
          csvContent
        );

        if (!result.success) {
          // Return 400 for validation errors
          return status(400, result);
        }

        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: t.Object({
          file: t.File(),
        }),
        detail: {
          summary: "Import Time Entries from CSV",
          description:
            "Import multiple time entries from a CSV file. Required columns: date, timekeeperName, hours, description. Optional columns: billId, metadata.*",
        },
      }
    );

// const app = new Elysia()
// 	.post('/upload',)
