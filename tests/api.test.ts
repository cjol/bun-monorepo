import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import { treaty } from "@elysiajs/eden";
import { getApp, type App } from "@ai-starter/api";
import { getContext } from "@ai-starter/api/context";
import { setupDB } from "./utils/db";

describe("API e2e", () => {
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
    const createResponse = await client.foos.post({ name: "Initial Foo" });

    expect(createResponse.status).toBe(201);
    expect(createResponse.data).toBeDefined();
    const created = createResponse.data!;
    expect(created.name).toBe("Initial Foo");
    expect(created.id).toBeDefined();
    const fooId = created.id;

    // 2. Get the foo
    const getResponse = await client.foos({ id: fooId }).get();

    expect(getResponse.status).toBe(200);
    expect(getResponse.data).toBeDefined();
    const retrieved = getResponse.data!;
    expect(retrieved).toEqual(created);

    // 3. Patch the foo
    const patchResponse = await client.foos({ id: fooId }).patch({
      name: "Updated Foo",
    });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.data).toBeDefined();
    const patched = patchResponse.data!;
    expect(patched.name).toBe("Updated Foo");
    expect(patched.id).toBe(fooId);

    // 4. Get the foo again to verify the update
    const finalGetResponse = await client.foos({ id: fooId }).get();

    expect(finalGetResponse.status).toBe(200);
    expect(finalGetResponse.data).toBeDefined();
    const final = finalGetResponse.data!;
    expect(final.name).toBe("Updated Foo");
    expect(final.id).toBe(fooId);
  });
});
