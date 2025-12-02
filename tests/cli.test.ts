import { describe, it, expect, beforeEach } from "bun:test";
import { $ } from "bun";
import * as fs from "node:fs";
import * as path from "node:path";
import { setupDB } from "./utils/db";

describe("CLI e2e", () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(async () => {
    ({ tmpDir, dbPath } = await setupDB("cli-test-"));
  });

  it("should add, get, patch, and get again a foo", async () => {
    const cliPath = path.resolve(__dirname, "../apps/cli/index.ts");

    console.log(
      `bun ${cliPath} add-foo "Initial Foo" --database file:${dbPath}`
    );
    // 1. Add a foo
    const addResult =
      await $`bun ${cliPath} add-foo "Initial Foo" --database file:${dbPath}`.text();

    expect(addResult).toContain("Foo Details:");
    expect(addResult).toContain("ID:");
    expect(addResult).toContain("Initial Foo");
    expect(addResult).toContain("Created:");

    // Extract the ID from the output (strip ANSI codes)
    // ULIDs are 26 characters using Crockford's Base32 (uppercase only)
    const idMatch = addResult.match(/ID:[^\n]*?([0-9A-HJKMNP-TV-Z]{26})/);
    expect(idMatch).not.toBeNull();
    const fooId = idMatch![1];
    if (!fooId) throw new Error("Failed to extract foo ID");

    // 2. Get the foo
    const getResult =
      await $`bun ${cliPath} get-foo ${fooId} --database file:${dbPath}`.text();

    expect(getResult).toContain("Foo Details:");
    expect(getResult).toContain(fooId);
    expect(getResult).toContain("Initial Foo");
    expect(getResult).toContain("Created:");
    expect(getResult).toContain("Updated:");

    // 3. Patch the foo
    const patchResult =
      await $`bun ${cliPath} patch-foo ${fooId} "Updated Foo" --database file:${dbPath}`.text();

    expect(patchResult).toContain("Foo Details:");
    expect(patchResult).toContain(fooId);
    expect(patchResult).toContain("Updated Foo");
    expect(patchResult).toContain("Created:");
    expect(patchResult).toContain("Updated:");

    // 4. Get the foo again to verify the update
    const finalGetResult =
      await $`bun ${cliPath} get-foo ${fooId} --database file:${dbPath}`.text();

    expect(finalGetResult).toContain("Foo Details:");
    expect(finalGetResult).toContain(fooId);
    expect(finalGetResult).toContain("Updated Foo");
    expect(finalGetResult).toContain("Created:");
    expect(finalGetResult).toContain("Updated:");

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should handle get with non-existent id", async () => {
    const cliPath = path.resolve(__dirname, "../apps/cli/index.ts");

    const getResult =
      await $`bun ${cliPath} get-foo non-existent-id --database file:${dbPath}`.text();

    expect(getResult).toContain("not found");

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should handle patch with non-existent id", async () => {
    const cliPath = path.resolve(__dirname, "../apps/cli/index.ts");

    const patchResult =
      await $`bun ${cliPath} patch-foo non-existent-id "New Name" --database file:${dbPath}`.text();

    expect(patchResult).toContain("not found");

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
