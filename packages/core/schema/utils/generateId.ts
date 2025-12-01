import { ulid } from "ulid";

/**
 * Generates a new ULID (Universally Unique Lexicographically Sortable Identifier).
 * ULIDs are more compact than UUIDs and are time-sortable, making them ideal for
 * database primary keys and URL-friendly identifiers.
 */
export const generateId = (): string => ulid();
