import { describe, expect, test } from "bun:test";
import { generateId } from "@ai-starter/core/schema/utils/generateId";

describe("setupDeterministicIds", () => {
  test("should generate deterministic times", () => {
    expect(new Date().toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(new Date().toISOString()).toBe("2025-01-01T00:00:01.000Z");
    expect(Date.now()).toBe(1735689600000 + 2000);
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
    expect(ids).toEqual([
      "01JGFJJZ00H7NE7NA00Q687B0D",
      "01JGFJJZZ8XMY6KN9J8S5BAZFD",
      "01JGFJK0YGHKS6FB8828HETW3G",
      "01JGFJK1XRWNK24MV2NV29KP2Q",
      "01JGFJK2X0MNYXJTQ48K0T5Q3Z",
    ]);
  });

  test("should generate the same IDs in isolated tests", () => {
    const ids = [
      generateId(),
      generateId(),
      generateId(),
      generateId(),
      generateId(),
    ];

    expect(ids).toEqual([
      "01JGFJJZ00H7NE7NA00Q687B0D",
      "01JGFJJZZ8XMY6KN9J8S5BAZFD",
      "01JGFJK0YGHKS6FB8828HETW3G",
      "01JGFJK1XRWNK24MV2NV29KP2Q",
      "01JGFJK2X0MNYXJTQ48K0T5Q3Z",
    ]);
  });
});
