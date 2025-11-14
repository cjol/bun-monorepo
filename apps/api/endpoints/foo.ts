import { Elysia, t } from "elysia";
import type { Context } from "../context";
import { notFound } from "@hapi/boom";

const idParamsSchema = t.Object({
  id: t.String(),
});

const fooBodySchema = t.Object({
  name: t.String({ minLength: 3 }),
});

export const fooRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/foos" })
    .get(
      "/:id",
      async ({ params, status }) => {
        const result = await app.foo.getFoo(params.id);
        if (!result) {
          throw notFound(`Foo with ID ${params.id} not found`);
        }
        return status(200, result);
      },
      { params: idParamsSchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.foo.createFoo(body.name);
        return status(201, result);
      },
      { body: fooBodySchema }
    )
    .patch(
      "/:id",
      async ({ params, body, status }) => {
        const result = await app.foo.patchFoo(params.id, body.name);
        return status(200, result);
      },
      { params: idParamsSchema, body: fooBodySchema }
    );
