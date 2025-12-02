import { describe, expect, test } from "bun:test";
import { generateId } from "@ai-starter/core/schema/utils/generateId";

describe("setupDeterministicIds", () => {
  test("should generate deterministic times", () => {
    const now = new Date();
    expect(new Date().toISOString()).toBe("2025-01-01T00:00:01.000Z");
    expect(new Date().toISOString()).toBe("2025-01-01T00:00:02.000Z");
    expect(Date.now()).toBe(1735689603000);
  });

  test("should generate the same IDs across multiple test runs", () => {
    const ids = [
      generateId(),
      generateId(),
      generateId(),
      generateId(),
      generateId(),
    ];

    // These should be identical if deterministic setup is working
    expect(ids).toMatchInlineSnapshot(`
      [
        "01JGFJK2X0H7NE7NA00Q687B0D",
        "01JGFJK3W8XMY6KN9J8S5BAZFD",
        "01JGFJK4VGHKS6FB8828HETW3G",
        "01JGFJK5TRWNK24MV2NV29KP2Q",
        "01JGFJK6T0MNYXJTQ48K0T5Q3Z",
      ]
    `);
  });
});
