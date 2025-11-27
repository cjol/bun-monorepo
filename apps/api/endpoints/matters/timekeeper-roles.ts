import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../../context";
import {
  newTimekeeperRoleInputSchema,
  updateTimekeeperRoleInputSchema,
} from "@ai-starter/core/schema/timekeeperRole";

const matterRoleParamsSchema = t.Object({
  matterId: t.String(),
  roleId: t.String(),
});

const matterIdParamsSchema = t.Object({
  matterId: t.String(),
});

const timekeeperRoleQuerySchema = t.Object({
  timekeeperId: t.Optional(t.String()),
});

export const matterTimekeeperRoleRoutes = ({ app }: Context) =>
  new Elysia()
    .get(
      "/matters/:matterId/timekeeper-roles/:roleId",
      async ({ params, status }) => {
        const result = await app.timekeeperRole.getTimekeeperRole(
          params.roleId
        );
        if (!result || result.matterId !== params.matterId) {
          throw notFound(
            `Timekeeper role with ID ${params.roleId} not found in matter ${params.matterId}`
          );
        }
        return status(200, result);
      },
      { params: matterRoleParamsSchema }
    )
    .get(
      "/matters/:matterId/timekeeper-roles",
      async ({ params, query, status }) => {
        if (query.timekeeperId) {
          // Get all roles for a specific timekeeper, filtered by matter
          const allRoles = await app.timekeeperRole.listByTimekeeper(
            query.timekeeperId
          );
          const result = allRoles.filter(
            (role) => role.matterId === params.matterId
          );
          return status(200, result);
        }
        const result = await app.timekeeperRole.listByMatter(params.matterId);
        return status(200, result);
      },
      { params: matterIdParamsSchema, query: timekeeperRoleQuerySchema }
    )
    .post(
      "/matters/:matterId/timekeeper-roles",
      async ({ params, body, status }) => {
        // Ensure the matterId in the body matches the URL
        const result = await app.timekeeperRole.createTimekeeperRole({
          ...body,
          matterId: params.matterId,
        });
        return status(201, result);
      },
      {
        params: matterIdParamsSchema,
        body: newTimekeeperRoleInputSchema.omit({ matterId: true }),
      }
    )
    .patch(
      "/matters/:matterId/timekeeper-roles/:roleId",
      async ({ params, body, status }) => {
        // Verify the role belongs to the matter before updating
        const existing = await app.timekeeperRole.getTimekeeperRole(
          params.roleId
        );
        if (!existing || existing.matterId !== params.matterId) {
          throw notFound(
            `Timekeeper role with ID ${params.roleId} not found in matter ${params.matterId}`
          );
        }
        const result = await app.timekeeperRole.updateTimekeeperRole(
          params.roleId,
          body
        );
        return status(200, result);
      },
      {
        params: matterRoleParamsSchema,
        body: updateTimekeeperRoleInputSchema.omit({
          id: true,
          matterId: true,
        }),
      }
    );
