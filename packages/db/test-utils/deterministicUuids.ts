let timeCounter = 0;
const baseTime = new Date("2025-01-01T00:00:00.000Z").getTime();

/**
 * Sets up deterministic ID and timestamp generation for tests.
 * Seeds Math.random to make ULID generation deterministic.
 * Overrides Date constructor and Date.now() to return deterministic timestamps.
 * This ensures that the same sequence of operations always generates the same IDs and timestamps,
 * which is crucial for prompt caching in evals.
 */
export function setupDeterministicIds() {
  timeCounter = 0; // Reset time counter

  // Seed Math.random for deterministic ULID generation
  let randomSeed = 12345;
  Math.random = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
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

/** @deprecated Use setupDeterministicIds instead */
export const setupDeterministicUUIDs = setupDeterministicIds;

setupDeterministicIds();
