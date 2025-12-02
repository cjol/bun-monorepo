import { ulid } from "ulid";

let defaultPrng: (() => number) | undefined = undefined;
let defaultSeedTime: (() => number) | undefined = undefined;

/**
 * Sets the default PRNG and seed time for ULID generation.
 * This is used by test utilities to make ID generation deterministic.
 * @internal
 */
export const setDefaultGeneratorOptions = (options: {
  prng?: (() => number) | undefined;
  seedTime?: (() => number) | undefined;
}) => {
  defaultPrng = options.prng;
  defaultSeedTime = options.seedTime;
};

/**
 * Generates a new ULID (Universally Unique Lexicographically Sortable Identifier).
 * ULIDs are more compact than UUIDs and are time-sortable, making them ideal for
 * database primary keys and URL-friendly identifiers.
 */
export const generateId = (): string => {
  const seedTime = defaultSeedTime?.();
  const prng = defaultPrng;
  return ulid(seedTime, prng);
};
