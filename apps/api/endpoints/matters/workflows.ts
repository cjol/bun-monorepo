import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../../context";
import {
  newWorkflowInputSchema,
  updateWorkflowInputSchema,
} from "@ai-starter/core/schema/workflow";

const matterWorkflowParamsSchema = t.Object({
  matterId: t.String(),
  workflowId: t.String(),
});

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

export const matterWorkflowRoutes = ({ app }: Context) =>
  new Elysia()
    .get(
      "/matters/:matterId/workflows/:workflowId",
      async ({ params, status }) => {
        const result = await app.workflow.getWorkflow(params.workflowId);
        if (!result || result.matterId !== params.matterId) {
          throw notFound(
            `Workflow with ID ${params.workflowId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      { params: matterWorkflowParamsSchema }
    )
    .get(
      "/matters/:matterId/workflows",
      async ({ params, status }) => {
        const result = await app.workflow.listByMatter(params.matterId);
        return status(200, result);
      },
      { params: matterIdParamsSchema }
    )
    .post(
      "/matters/:matterId/workflows",
      async ({ params, body, status }) => {
        // Ensure the matterId in the body matches the URL
        const result = await app.workflow.createWorkflow({
          ...body,
          matterId: params.matterId,
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: newWorkflowInputSchema.omit({ matterId: true }),
      }
    )
    .patch(
      "/matters/:matterId/workflows/:workflowId",
      async ({ params, body, status }) => {
        // Verify the workflow belongs to the matter before updating
        const existing = await app.workflow.getWorkflow(params.workflowId);
        if (!existing || existing.matterId !== params.matterId) {
          throw notFound(
            `Workflow with ID ${params.workflowId} not found in matter ${params.matterId}`
          );
        }
        const result = await app.workflow.updateWorkflow(
          params.workflowId,
          body
        );
        return status(200, result);
      },
      {
        params: matterWorkflowParamsSchema,
        body: updateWorkflowInputSchema.omit({ id: true, matterId: true }),
      }
    )
    .delete(
      "/matters/:matterId/workflows/:workflowId",
      async ({ params, status }) => {
        // Verify the workflow belongs to the matter before deleting
        const existing = await app.workflow.getWorkflow(params.workflowId);
        if (!existing || existing.matterId !== params.matterId) {
          throw notFound(
            `Workflow with ID ${params.workflowId} not found in matter ${params.matterId}`
          );
        }
        await app.workflow.deleteWorkflow(params.workflowId);
        return status(204);
      },
      { params: matterWorkflowParamsSchema }
    );
