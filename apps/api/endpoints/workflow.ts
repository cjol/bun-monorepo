import { Elysia, t } from "elysia";
import type { Context } from "../context";
import { notFound } from "@hapi/boom";

const idParamsSchema = t.Object({
  id: t.String(),
});

const workflowBodySchema = t.Object({
  matterId: t.String({ minLength: 1 }),
  name: t.String({ minLength: 1 }),
  instructions: t.String({ minLength: 1 }),
});

const workflowQuerySchema = t.Object({
  matterId: t.Optional(t.String()),
});

const workflowPatchSchema = t.Partial(workflowBodySchema);

export const workflowRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/workflows" })
    .get(
      "/",
      async ({ query, status }) => {
        if (!query.matterId) {
          return status(400, {
            error: "matterId query parameter is required",
          });
        }
        const workflows = await app.workflow.listByMatter(query.matterId);
        return status(200, workflows);
      },
      { query: workflowQuerySchema }
    )
    .get(
      "/:id",
      async ({ params, status }) => {
        const result = await app.workflow.getWorkflow(params.id);
        if (!result) {
          throw notFound(`Workflow with ID ${params.id} not found`);
        }
        return status(200, result);
      },
      { params: idParamsSchema }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.workflow.createWorkflow({
          matterId: body.matterId,
          name: body.name,
          instructions: body.instructions,
        });
        return status(201, result);
      },
      { body: workflowBodySchema }
    )
    .patch(
      "/:id",
      async ({ params, body, status }) => {
        try {
          const result = await app.workflow.updateWorkflow(params.id, {
            name: body.name,
            instructions: body.instructions,
          });
          return status(200, result);
        } catch (error) {
          if (error instanceof Error && error.message.includes("not found")) {
            throw notFound(error.message);
          }
          throw error;
        }
      },
      { params: idParamsSchema, body: workflowPatchSchema }
    )
    .delete(
      "/:id",
      async ({ params, status }) => {
        const workflow = await app.workflow.getWorkflow(params.id);
        if (!workflow) {
          throw notFound(`Workflow with ID ${params.id} not found`);
        }
        await app.workflow.deleteWorkflow(params.id);
        return status(204);
      },
      { params: idParamsSchema }
    );
