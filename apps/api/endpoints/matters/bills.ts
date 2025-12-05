import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../../context";
import {
  newBillInputSchema,
  updateBillInputSchema,
} from "@ai-starter/core/schema/bill";

const matterBillParamsSchema = t.Object({
  matterId: t.String(),
  billId: t.String(),
});

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

export const matterBillRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/matters/:matterId/bills", tags: ["bill"] })
    .get(
      "/:billId",
      async ({ params, status }) => {
        const result = await app.bill.getBill(params.billId);
        if (!result || result.matterId !== params.matterId) {
          throw notFound(
            `Bill with ID ${params.billId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      {
        params: matterBillParamsSchema,
        detail: {
          summary: "Get Bill",
          description: "Retrieve a single bill by ID within a matter.",
        },
      }
    )
    .get(
      "/",
      async ({ params, status }) => {
        const result = await app.bill.listByMatter(params.matterId);
        return status(200, result);
      },
      {
        params: matterIdParamsSchema,
        detail: {
          summary: "List Bills",
          description: "Retrieve a list of all bills for a matter.",
        },
      }
    )
    .post(
      "/",
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
        detail: {
          summary: "Create Bill",
          description: "Create a new bill for a matter.",
        },
      }
    )
    .patch(
      "/:billId",
      async ({ params, body, status: statusCode }) => {
        // Verify the bill belongs to the matter before updating
        const existing = await app.bill.getBill(params.billId);
        if (!existing || existing.matterId !== params.matterId) {
          throw notFound(
            `Bill with ID ${params.billId} not found in matter ${params.matterId}`
          );
        }
        const { periodStart, periodEnd, status } = body;
        const result = await app.bill.updateBill(params.billId, {
          ...(periodStart ? { periodStart: new Date(periodStart) } : {}),
          ...(periodEnd ? { periodEnd: new Date(periodEnd) } : {}),
          ...(status ? { status } : {}),
        });
        return statusCode(200, result);
      },
      {
        params: matterBillParamsSchema,
        body: updateBillInputSchema,
        detail: {
          summary: "Update Bill",
          description: "Update an existing bill within a matter.",
        },
      }
    );
