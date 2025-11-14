import { Elysia } from "elysia";
import { getContext, type Context } from "./context";
import { fooRoutes } from "./endpoints/foo";
import { matterRoutes } from "./endpoints/matter";
import { billRoutes } from "./endpoints/bill";
import { timeEntryRoutes } from "./endpoints/timeEntry";
import { env } from "./utils/env";
import { Boom, isBoom } from "@hapi/boom";

export const getApp = (ctx: Context) =>
  new Elysia()
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
    .use(fooRoutes(ctx))
    .use(matterRoutes(ctx))
    .use(billRoutes(ctx))
    .use(timeEntryRoutes(ctx));

export type App = ReturnType<typeof getApp>;

if (import.meta.main) {
  const ctx = getContext(env.DATABASE_URL);
  const app = getApp(ctx).listen(3000);

  const hostname: string = app.server?.hostname ?? "localhost";
  const port: number = app.server?.port ?? 3000;

  console.log(`🦊 Elysia is running at ${hostname}:${port}`);
}
