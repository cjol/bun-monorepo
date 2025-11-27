import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import { treaty } from "@elysiajs/eden";
import { getApp, type App } from "@ai-starter/api";
import { getContext } from "@ai-starter/api/context";
import { setupDB } from "./utils/db";

describe.skip("API e2e", () => {
  let tmpDir: string;
  let client: ReturnType<typeof treaty<App>>;

  beforeEach(async () => {
    const { tmpDir: dir, dbPath } = await setupDB("api-test-");
    tmpDir = dir;

    const ctx = getContext(`file:${dbPath}`);
    const app = getApp(ctx);
    client = treaty<App>(app);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should create, get, patch, and get again a foo", async () => {
    // 1. Create a foo
    const createResponse = await client
      .matters({ matterId: "123" })
      .bills.get();
  });
});
