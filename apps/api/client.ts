import { treaty } from "@elysiajs/eden";
import type { App } from "./index";

/**
 * Create a type-safe treaty client for the API.
 *
 * @param target - Either a URL string for remote API, or an Elysia app instance for local testing
 * @returns A fully typed treaty client
 */
export function createClient(target: string | App) {
  return treaty<App>(target);
}

export type { App };
