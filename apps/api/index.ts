import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { getContext, type Context } from "./context";
import { matterRoutes } from "./endpoints/matters";
import { timekeeperRoutes } from "./endpoints/timekeepers";
import { roleRoutes } from "./endpoints/roles";
import { matterBillRoutes } from "./endpoints/matters/bills";
import { matterTimeEntryRoutes } from "./endpoints/matters/time-entries";
import { matterAiSuggestionRoutes } from "./endpoints/matters/ai-suggestions";
import { matterWorkflowRoutes } from "./endpoints/matters/workflows";
import { matterTimekeeperRoleRoutes } from "./endpoints/matters/timekeeper-roles";
import { env } from "./utils/env";
import { Boom, isBoom } from "@hapi/boom";
import { openapi, fromTypes } from "@elysiajs/openapi";
import z from "zod";

export const getApp = (ctx: Context) =>
  new Elysia()
    .use(cors())
    .use(
      openapi({
        references: fromTypes("index.ts", {
          projectRoot: __dirname,
          debug: true,
        }),
        mapJsonSchema: {
          zod: z.toJSONSchema,
        },
        documentation: {
          info: {
            title: "FixMyTime API",
            version: "0.1.0",
          },
          tags: [
            { name: "matter", description: "Matter related endpoints" },
            { name: "timekeeper", description: "Timekeeper related endpoints" },
            { name: "role", description: "Role related endpoints" },
            { name: "bill", description: "Bill related endpoints" },
            { name: "time-entry", description: "Time entry related endpoints" },
            {
              name: "suggestion",
              description: "Suggestion related endpoints",
            },
            { name: "workflow", description: "Workflow related endpoints" },
            {
              name: "timekeeper-role",
              description: "Timekeeper role related endpoints",
            },
          ],
        },
      })
    )
    .error({ Boom })
    .onError(({ error, status }) => {
      if (isBoom(error)) {
        // don't repeat the status code
        const { statusCode: _statusCode, ...payload } = error.output.payload;
        return status(error.output.statusCode, payload);
      }

      return error;
    })
    .get("/", () => ({ message: "AI Starter API" }))
    .get("/health", () => ({ status: "ok" }))
    .use(matterRoutes(ctx))
    .use(timekeeperRoutes(ctx))
    .use(roleRoutes(ctx))
    .use(matterBillRoutes(ctx))
    .use(matterTimeEntryRoutes(ctx))
    .use(matterAiSuggestionRoutes(ctx))
    .use(matterWorkflowRoutes(ctx))
    .use(matterTimekeeperRoleRoutes(ctx));

export type App = ReturnType<typeof getApp>;

// pretend we have an app to export so that elysia typegen can see it
function main() {
  const ctx = getContext(env.DATABASE_URL);
  const app = getApp(ctx).listen(3000);

  const hostname: string = app.server?.hostname ?? "localhost";
  const port: number = app.server?.port ?? 3000;

  console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
  return app;
}

// we have to have a top-level export for elysia openapi typegen to work
export const app = import.meta.main ? main() : null;
