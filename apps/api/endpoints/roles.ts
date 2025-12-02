import { Elysia, t } from "elysia";
import { notFound } from "@hapi/boom";

import type { Context } from "../context";
import {
  newRoleInputSchema,
  updateRoleInputSchema,
} from "@ai-starter/core/schema/role";

const roleIdParamsSchema = t.Object({
  roleId: t.String(),
});

export const roleRoutes = ({ app }: Context) =>
  new Elysia({ prefix: "/roles", tags: ["role"] })
    .get(
      "/",
      async ({ status }) => {
        const result = await app.role.listRoles();
        return status(200, result);
      },
      {
        detail: {
          summary: "List Roles",
          description: "Retrieve a list of all roles.",
        },
      }
    )
    .get(
      "/:roleId",
      async ({ params, status }) => {
        const result = await app.role.getRole(params.roleId);
        if (!result) {
          throw notFound(`Role with ID ${params.roleId} not found`);
        }
        return status(200, result);
      },
      {
        params: roleIdParamsSchema,
        detail: {
          summary: "Get Role",
          description: "Retrieve a single role by ID.",
        },
      }
    )
    .post(
      "/",
      async ({ body, status }) => {
        const result = await app.role.createRole(body);
        return status(201, result);
      },
      {
        body: newRoleInputSchema,
        detail: {
          summary: "Create Role",
          description: "Create a new role.",
        },
      }
    )
    .patch(
      "/:roleId",
      async ({ params, body, status }) => {
        const result = await app.role.updateRole(params.roleId, body);
        return status(200, result);
      },
      {
        params: roleIdParamsSchema,
        body: updateRoleInputSchema.omit({ id: true }),
        detail: {
          summary: "Update Role",
          description: "Update an existing role.",
        },
      }
    )
    .delete(
      "/:roleId",
      async ({ params, status }) => {
        await app.role.deleteRole(params.roleId);
        return status(204);
      },
      {
        params: roleIdParamsSchema,
        detail: {
          summary: "Delete Role",
          description: "Delete a role.",
        },
      }
    );
