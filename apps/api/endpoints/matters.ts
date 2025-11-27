import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../context";
import {
  newMatterInputSchema,
  updateMatterInputSchema,
} from "@ai-starter/core/schema/matter";

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

export const matterRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/matters", tags: ["matter"] })
    .get(
      "/",
      async ({ status }) => {
        const result = await app.matter.listMatters();
        return status(200, result);
      },
      {
        detail: {
          summary: "List Matters",
          description: "Retrieve a list of all matters.",
        },
      }
    )
    .get(
      "/:matterId",
      async ({ params, status }) => {
        const result = await app.matter.getMatter(params.matterId);
        if (!result) {
          throw notFound(`Matter with ID ${params.matterId} not found`);
        }
        return status(200, result);
      },
      {
        params: matterIdParamsSchema,
        detail: {
          summary: "Get Matter",
          description: "Retrieve a single matter by ID.",
        },
      }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.matter.createMatter(body);
        return status(201, result);
      },
      {
        body: newMatterInputSchema,
        detail: {
          summary: "Create Matter",
          description: "Create a new matter.",
        },
      }
    )
    .patch(
      "/:matterId",
      async ({ params, body, status }) => {
        const result = await app.matter.updateMatter(params.matterId, body);
        return status(200, result);
      },
      {
        params: matterIdParamsSchema,
        body: updateMatterInputSchema.omit({ id: true }),
        detail: {
          summary: "Update Matter",
          description: "Update an existing matter.",
        },
      }
    )
    .delete(
      "/:matterId",
      async ({ params, status }) => {
        await app.matter.deleteMatter(params.matterId);
        return status(204);
      },
      {
        params: matterIdParamsSchema,
        detail: {
          summary: "Delete Matter",
          description: "Delete a matter.",
        },
      }
    );
