import { z } from "zod";

/**
 * Common Zod validation helpers for reuse across all schema files.
 * These provide consistent validation patterns throughout the application.
 */

/** UUID string validation */
export const uuidSchema = z.uuid();

/** ISO date string validation (e.g. 2025-01-01) */
export const isoDateSchema = z
  .string()
  .describe("ISO date string (e.g. 2025-01-01)");

/** Email address validation */
export const emailSchema = z.email();

/** Positive number validation */
export const positiveNumberSchema = z.number().positive();
