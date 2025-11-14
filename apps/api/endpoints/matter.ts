import { Elysia, t } from "elysia";
import type { Context } from "../context";
import { notFound } from "@hapi/boom";

const idParamsSchema = t.Object({
  id: t.String(),
});

const matterBodySchema = t.Object({
  clientName: t.String({ minLength: 1 }),
  matterName: t.String({ minLength: 1 }),
  description: t.Union([t.String(), t.Null()]),
});

const matterPatchSchema = t.Partial(matterBodySchema);

export const matterRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/matters" })
    .get(
      "/:id",
      async ({ params, status }) => {
        const result = await app.matter.getMatter(params.id);
        if (!result) {
          throw notFound(`Matter with ID ${params.id} not found`);
        }
        return status(200, result);
      },
      { params: idParamsSchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.matter.createMatter({
          clientName: body.clientName,
          matterName: body.matterName,
          description: body.description,
        });
        return status(201, result);
      },
      { body: matterBodySchema }
    )
    .patch(
      "/:id",
      async ({ params, body, status }) => {
        const result = await app.matter.updateMatter(params.id, {
          clientName: body.clientName,
          matterName: body.matterName,
          description: body.description,
        });
        return status(200, result);
      },
      { params: idParamsSchema, body: matterPatchSchema }
    )
    .delete(
      "/:id",
      async ({ params, status }) => {
        const matter = await app.matter.getMatter(params.id);
        if (!matter) {
          throw notFound(`Matter with ID ${params.id} not found`);
        }
        await app.matter.deleteMatter(params.id);
        return status(204);
      },
      { params: idParamsSchema }
    );
