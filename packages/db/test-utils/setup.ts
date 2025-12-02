import { beforeEach } from "bun:test";
import { setupDeterministicIds } from "./deterministicUuids";

/**
 * Global test setup that runs before each Bun test.
 * Resets deterministic ID and timestamp generation to ensure test isolation.
 * This prevents tests from affecting each other's ID generation.
 *
 * Note: This file is only for Bun tests. Evalite evals should manually call
 * setupDeterministicIds() in their task functions if they need isolation.
 */

beforeEach(() => {
  setupDeterministicIds();
});
