import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../../context";
import { newBillInputSchema } from "@ai-starter/core/schema/bill";

const matterBillParamsSchema = t.Object({
  matterId: t.String(),
  billId: t.String(),
});

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

export const matterBillRoutes = ({ app }: Context) =>
  new Elysia()
    .get(
      "/matters/:matterId/bills/:billId",
      async ({ params, status }) => {
        const result = await app.bill.getBill(params.billId);
        if (!result || result.matterId !== params.matterId) {
          throw notFound(
            `Bill with ID ${params.billId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      { params: matterBillParamsSchema }
    )
    .get(
      "/matters/:matterId/bills",
      async ({ params, status }) => {
        const result = await app.bill.listByMatter(params.matterId);
        return status(200, result);
      },
      { params: matterIdParamsSchema }
    )
    .post(
      "/matters/:matterId/bills",
      async ({ params, body, status }) => {
        // Ensure the matterId in the body matches the URL
        const result = await app.bill.createBill({
          ...body,
          matterId: params.matterId,
          periodStart: new Date(body.periodStart),
          periodEnd: new Date(body.periodEnd),
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: newBillInputSchema.omit({ matterId: true }),
      }
    );
