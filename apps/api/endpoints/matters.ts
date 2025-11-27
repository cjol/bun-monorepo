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
  new Elysia({ prefix: "/matters" })
    .get(
      "/:matterId",
      async ({ params, status }) => {
        const result = await app.matter.getMatter(params.matterId);
        if (!result) {
          throw notFound(`Matter with ID ${params.matterId} not found`);
        }
        return status(200, result);
      },
      { params: matterIdParamsSchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.matter.createMatter(body);
        return status(201, result);
      },
      { body: newMatterInputSchema }
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
      }
    )
    .delete(
      "/:matterId",
      async ({ params, status }) => {
        await app.matter.deleteMatter(params.matterId);
        return status(204);
      },
      { params: matterIdParamsSchema }
    );
