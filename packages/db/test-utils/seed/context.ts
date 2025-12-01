import type { Bill, Matter, TimeEntry, Timekeeper } from "@ai-starter/core";
import type { DB } from "../../db";
import { doSeedRoles } from "./timekeeper";
import { createTestMatter } from "./matter";
import { createTestTimekeeper } from "./timekeeper";
import { createTestBill } from "./bill";
import { createTestTimeEntry } from "./timeEntry";

/**
 * Basic test context with just a matter
 */
export interface BasicTestContext {
  db: DB;
  matter: Matter;
}

/**
 * Time tracking test context with matter, timekeeper, and optional bill
 */
export interface TimeTrackingTestContext extends BasicTestContext {
  timekeeper: Timekeeper;
  bill?: Bill;
}

/**
 * Full test context with matter, timekeeper, bill, and time entry
 */
export interface FullTestContext extends TimeTrackingTestContext {
  bill: Bill;
  timeEntry: TimeEntry;
}

/**
 * Creates a basic test context with roles seeded and a matter created
 */
export async function createBasicTestContext(
  db: DB,
  options?: {
    seedRoles?: boolean;
    matterOverrides?: {
      clientName?: string;
      matterName?: string;
      description?: string;
    };
  }
): Promise<BasicTestContext> {
  // Only seed roles if explicitly requested (defaults to true for first context)
  if (options?.seedRoles !== false) {
    await doSeedRoles(db);
  }

  const matter = await createTestMatter(db, options?.matterOverrides);
  if (!matter) throw new Error("Failed to create matter");

  return { db, matter };
}

/**
 * Creates a time tracking test context with roles, matter, timekeeper, and optionally a bill
 */
export async function createTimeTrackingTestContext(
  db: DB,
  options?: {
    seedRoles?: boolean;
    withBill?: boolean;
    matterOverrides?: {
      clientName?: string;
      matterName?: string;
      description?: string;
    };
    timekeeperOverrides?: {
      name?: string;
      email?: string;
    };
    billOverrides?: {
      periodStart?: Date;
      periodEnd?: Date;
    };
  }
): Promise<TimeTrackingTestContext> {
  const { matter } = await createBasicTestContext(db, {
    seedRoles: options?.seedRoles,
    matterOverrides: options?.matterOverrides,
  });

  const timekeeper = await createTestTimekeeper(db, matter.id, {
    roleId: "01HT0000000000000000000001", // role-associate
    ...options?.timekeeperOverrides,
  });
  if (!timekeeper) throw new Error("Failed to create timekeeper");

  let bill: Bill | undefined;
  if (options?.withBill) {
    const createdBill = await createTestBill(
      db,
      matter.id,
      options?.billOverrides
    );
    if (!createdBill) throw new Error("Failed to create bill");
    bill = createdBill;
  }

  return { db, matter, timekeeper, bill };
}

/**
 * Creates a full test context with roles, matter, timekeeper, bill, and time entry
 */
export async function createFullTestContext(
  db: DB,
  options?: {
    seedRoles?: boolean;
    matterOverrides?: {
      clientName?: string;
      matterName?: string;
      description?: string;
    };
    timekeeperOverrides?: {
      name?: string;
      email?: string;
    };
    billOverrides?: {
      periodStart?: Date;
      periodEnd?: Date;
    };
    timeEntryOverrides?: {
      date?: Date;
      hours?: number;
      description?: string;
    };
  }
): Promise<FullTestContext> {
  const { matter, timekeeper, bill } = await createTimeTrackingTestContext(db, {
    seedRoles: options?.seedRoles,
    withBill: true,
    matterOverrides: options?.matterOverrides,
    timekeeperOverrides: options?.timekeeperOverrides,
    billOverrides: options?.billOverrides,
  });

  if (!bill) throw new Error("Failed to create bill");

  const timeEntry = await createTestTimeEntry(
    db,
    matter.id,
    timekeeper.id,
    options?.timeEntryOverrides
  );
  if (!timeEntry) throw new Error("Failed to create time entry");

  return { db, matter, timekeeper, bill, timeEntry };
}
