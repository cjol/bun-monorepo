import { Elysia, t } from "elysia";
import type { Context } from "../context";
import { notFound } from "@hapi/boom";

const idParamsSchema = t.Object({
  id: t.String(),
});

const billBodySchema = t.Object({
  matterId: t.String({ minLength: 1 }),
  periodStart: t.String(),
  periodEnd: t.String(),
  status: t.Union([
    t.Literal("draft"),
    t.Literal("finalized"),
    t.Literal("sent"),
    t.Literal("paid"),
  ]),
});

const billPatchSchema = t.Partial(billBodySchema);

const billQuerySchema = t.Object({
  matterId: t.Optional(t.String()),
});

export const billRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/bills" })
    .get(
      "/",
      async ({ query, status }) => {
        if (query.matterId) {
          const bills = await app.bill.listByMatter(query.matterId);
          return status(200, bills);
        }
        return status(400, { error: "matterId query parameter is required" });
      },
      { query: billQuerySchema }
    )
    .get(
      "/:id",
      async ({ params, status }) => {
        const result = await app.bill.getBill(params.id);
        if (!result) {
          throw notFound(`Bill with ID ${params.id} not found`);
        }
        return status(200, result);
      },
      { params: idParamsSchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.bill.createBill({
          matterId: body.matterId,
          periodStart: new Date(body.periodStart),
          periodEnd: new Date(body.periodEnd),
          status: body.status,
        });
        return status(201, result);
      },
      { body: billBodySchema }
    )
    .patch(
      "/:id",
      async ({ params, body, status }) => {
        const result = await app.bill.updateBill(params.id, {
          matterId: body.matterId,
          periodStart: body.periodStart
            ? new Date(body.periodStart)
            : undefined,
          periodEnd: body.periodEnd ? new Date(body.periodEnd) : undefined,
          status: body.status,
        });
        return status(200, result);
      },
      { params: idParamsSchema, body: billPatchSchema }
    )
    .delete(
      "/:id",
      async ({ params, status }) => {
        const bill = await app.bill.getBill(params.id);
        if (!bill) {
          throw notFound(`Bill with ID ${params.id} not found`);
        }
        await app.bill.deleteBill(params.id);
        return status(204);
      },
      { params: idParamsSchema }
    );
