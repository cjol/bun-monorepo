import { z } from "zod";

/**
 * Common Zod validation helpers for reuse across all schema files.
 * These provide consistent validation patterns throughout the application.
 */

/**
 * ULID string validation
 * ULIDs are 26 characters using Crockford's Base32 (0-9, A-H, J-K, M-N, P-T, V-Z)
 */
export const ulidSchema = z.ulid();

/** @deprecated Use ulidSchema instead - kept for backwards compatibility during migration */
export const uuidSchema = ulidSchema;

/** ISO date string validation (e.g. 2025-01-01) */
export const isoDateSchema = z
  .string()
  .describe("ISO date string (e.g. 2025-01-01)");

/** Email address validation */
export const emailSchema = z.email();

/** Positive number validation */
export const positiveNumberSchema = z.number().positive();
