import { createHash } from "node:crypto";

let uuidCounter = 0;
let timeCounter = 0;
const baseTime = new Date("2025-01-01T00:00:00.000Z").getTime();

/**
 * Sets up deterministic UUID and timestamp generation for tests.
 * Overrides crypto.randomUUID() to return deterministic UUIDs based on a counter.
 * Overrides Date constructor and Date.now() to return deterministic timestamps.
 * This ensures that the same sequence of operations always generates the same UUIDs and timestamps,
 * which is crucial for prompt caching in evals.
 */
export function setupDeterministicUUIDs() {
  uuidCounter = 0; // Reset counter
  timeCounter = 0; // Reset time counter

  // Override crypto.randomUUID for deterministic UUIDs
  crypto.randomUUID = () => {
    const hash = createHash("sha256")
      .update(`test-seed-${uuidCounter++}`)
      .digest("hex");

    // Format as valid UUID v4
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  };

  // Save original Date
  const OriginalDate = Date;

  // Override Date constructor for deterministic timestamps
  // @ts-expect-error - We're intentionally overriding the global Date
  globalThis.Date = class extends OriginalDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        // new Date() with no args - return deterministic time
        super(baseTime + timeCounter++ * 1000); // Increment by 1 second each time
      } else {
        // new Date(arg) - pass through to original
        // @ts-expect-error - We know this is valid
        super(...args);
      }
    }

    // Static methods
    static override now() {
      return baseTime + timeCounter++ * 1000;
    }

    static override parse = OriginalDate.parse;
    static override UTC = OriginalDate.UTC;
  };

  // Copy over any other static properties
  Object.setPrototypeOf(globalThis.Date, OriginalDate);
}

setupDeterministicUUIDs();
