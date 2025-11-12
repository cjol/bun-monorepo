import { Elysia } from "elysia";
import { getContext, type Context } from "./context";
import { fooRoutes } from "./endpoints/foo";
import { env } from "./utils/env";
import { Boom, isBoom } from "@hapi/boom";

export const getApp = (ctx: Context) =>
  new Elysia()
    .error({ Boom })
    .onError(({ error, status }) => {
      console.log("Error occurred:", isBoom(error));
      if (isBoom(error)) {
        // don't repeat the status code
        const { statusCode: _statusCode, ...payload } = error.output.payload;
        return status(error.output.statusCode, payload);
      }

      return error;
    })
    .get("/", () => ({ message: "AI Starter API" }))
    .get("/health", () => ({ status: "ok" }))
    .use(fooRoutes(ctx));

if (import.meta.main) {
  const ctx = getContext(env.DATABASE_URL);
  const app = getApp(ctx).listen(3000);

  const hostname: string = app.server?.hostname ?? "localhost";
  const port: number = app.server?.port ?? 3000;

  console.log(`🦊 Elysia is running at ${hostname}:${port}`);
}
