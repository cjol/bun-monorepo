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
  new Elysia({
    prefix: "/matters/:matterId/timekeeper-roles",
    tags: ["timekeeper-role"],
  })
    .get(
      "/:roleId",
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
      {
        params: matterRoleParamsSchema,
        detail: {
          summary: "Get Timekeeper Role",
          description:
            "Retrieve a single timekeeper role by ID within a matter.",
        },
      }
    )
    .get(
      "/",
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
      {
        params: matterIdParamsSchema,
        query: timekeeperRoleQuerySchema,
        detail: {
          summary: "List Timekeeper Roles",
          description:
            "Retrieve a list of all timekeeper roles for a matter, optionally filtered by timekeeper.",
        },
      }
    )
    .post(
      "/",
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
        detail: {
          summary: "Create Timekeeper Role",
          description: "Create a new timekeeper role for a matter.",
        },
      }
    )
    .patch(
      "/:roleId",
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
        detail: {
          summary: "Update Timekeeper Role",
          description: "Update an existing timekeeper role within a matter.",
        },
      }
    )
    .delete(
      "/:roleId",
      async ({ params, status }) => {
        // Verify the role belongs to the matter before deleting
        const existing = await app.timekeeperRole.getTimekeeperRole(
          params.roleId
        );
        if (!existing || existing.matterId !== params.matterId) {
          throw notFound(
            `Timekeeper role with ID ${params.roleId} not found in matter ${params.matterId}`
          );
        }
        await app.timekeeperRole.deleteTimekeeperRole(params.roleId);
        return status(204);
      },
      {
        params: matterRoleParamsSchema,
        detail: {
          summary: "Delete Timekeeper Role",
          description: "Remove a timekeeper role from a matter.",
        },
      }
    );
