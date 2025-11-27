import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../context";
import {
  newTimekeeperInputSchema,
  updateTimekeeperInputSchema,
} from "@ai-starter/core/schema/timekeeper";

const timekeeperIdParamsSchema = t.Object({
  timekeeperId: t.String(),
});

const emailQuerySchema = t.Object({
  email: t.Optional(t.String()),
});

export const timekeeperRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/timekeepers", tags: ["timekeeper"] })
    .get(
      "/",
      async ({ query, status }) => {
        if (query.email) {
          const result = await app.timekeeper.getTimekeeperByEmail(query.email);
          if (!result) {
            throw notFound(`Timekeeper with email ${query.email} not found`);
          }
          return status(200, result);
        }
        const result = await app.timekeeper.listAllTimekeepers();
        return status(200, result);
      },
      {
        query: emailQuerySchema,
        detail: {
          summary: "List Timekeepers",
          description:
            "Retrieve a list of all timekeepers or search for timekeepers by email.",
        },
      }
    )
    .get(
      "/:timekeeperId",
      async ({ params, status }) => {
        const result = await app.timekeeper.getTimekeeper(params.timekeeperId);
        if (!result) {
          throw notFound(`Timekeeper with ID ${params.timekeeperId} not found`);
        }
        return status(200, result);
      },
      {
        params: timekeeperIdParamsSchema,
        detail: {
          summary: "Get Timekeeper",
          description: "Retrieve a single timekeeper by ID.",
        },
      }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.timekeeper.createTimekeeper(body);
        return status(201, result);
      },
      {
        body: newTimekeeperInputSchema,
        detail: {
          summary: "Create Timekeeper",
          description: "Create a new timekeeper.",
        },
      }
    )
    .patch(
      "/:timekeeperId",
      async ({ params, body, status }) => {
        const result = await app.timekeeper.updateTimekeeper(
          params.timekeeperId,
          body
        );
        return status(200, result);
      },
      {
        params: timekeeperIdParamsSchema,
        body: updateTimekeeperInputSchema.omit({ id: true }),
        detail: {
          summary: "Update Timekeeper",
          description: "Update an existing timekeeper.",
        },
      }
    );
