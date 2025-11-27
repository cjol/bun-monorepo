import { treaty } from "@elysiajs/eden";
import type { App } from "@ai-starter/api";

// @ts-expect-error - Type mismatch between Elysia versions in monorepo
export const api = treaty<App>(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
);
