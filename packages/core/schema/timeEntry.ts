import {
  sqliteTable,
  text,
  integer,
  real,
  customType,
} from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import {
  ulidSchema,
  isoDateSchema,
  positiveNumberSchema,
} from "./utils/validation";
import { matterSchema } from "./matter";
import { billSchema } from "./bill";
import { timekeeperSchema } from "./timekeeper";
import { generateId } from "./utils/generateId";

export const timeEntrySchema = sqliteTable("time_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  timekeeperId: text("timekeeper_id")
    .notNull()
    .references(() => timekeeperSchema.id, { onDelete: "cascade" }),
  billId: text("bill_id").references(() => billSchema.id, {
    onDelete: "set null",
  }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  hours: real("hours").notNull(),
  description: text("description").notNull(),
  ...timestamps,
});

export type TimeEntry = typeof timeEntrySchema.$inferSelect;
export type NewTimeEntry = typeof timeEntrySchema.$inferInsert;

/**
 * Zod validation schemas for TimeEntry entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newTimeEntryInputSchema = z.object({
  matterId: ulidSchema.describe("The ULID of the matter"),
  timekeeperId: ulidSchema.describe("The ULID of the timekeeper"),
  billId: ulidSchema
    .nullable()
    .optional()
    .describe("The ULID of the bill (if assigned)"),
  date: isoDateSchema,
  hours: positiveNumberSchema.describe("Number of hours worked"),
  description: z.string().describe("Description of the work performed"),
});

export const updateTimeEntryInputSchema = newTimeEntryInputSchema
  .partial()
  .extend({
    id: ulidSchema.describe("The ULID of the time entry to update"),
  });

/** Use as a custom column in other tables */
export const jsonTimeEntry = customType<{
  data: TimeEntry;
  driverData: string;
}>({
  dataType() {
    return "text";
  },
  toDriver(value: TimeEntry) {
    return JSON.stringify({
      ...value,
      date: value.date.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
      createdAt: value.createdAt.toISOString(),
    });
  },
  fromDriver(value: string) {
    const val = JSON.parse(value);
    return {
      ...val,
      date: new Date(val.date),
      updatedAt: new Date(val.updatedAt),
      createdAt: new Date(val.createdAt),
    };
  },
});

export const jsonNewTimeEntry = customType<{
  data: NewTimeEntry;
  driverData: string;
}>({
  dataType() {
    return "text";
  },
  toDriver(value: NewTimeEntry | TimeEntry) {
    // explicitly strip out id, createdAt and updatedAt if they exist
    return JSON.stringify({
      ...value,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      date: value.date.toISOString(),
    });
  },
  fromDriver(value: string) {
    const val = JSON.parse(value);
    return {
      ...val,
      date: new Date(val.date),
    };
  },
});
