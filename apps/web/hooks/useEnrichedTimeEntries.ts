import { useMemo } from "react";
import type {
  TimeEntry,
  Timekeeper,
  Role,
  TimekeeperRole,
  Job,
} from "@ai-starter/core";

export interface EnrichedTimeEntry extends TimeEntry {
  timekeeperName: string;
  roleName: string;
  billableRate: number;
  jobs?: Job[];
}

type TimeEntryWithJobs = TimeEntry & { jobs?: Job[] };

interface UseEnrichedTimeEntriesParams {
  timeEntries?: TimeEntryWithJobs[];
  timekeepers?: Timekeeper[];
  roles?: Role[];
  timekeeperRoles?: TimekeeperRole[];
  matterId: string;
}

/**
 * Custom hook to enrich time entries with timekeeper name, role name, and billable rate.
 * Performs client-side joins between time entries, timekeepers, roles, and timekeeper roles.
 */
export function useEnrichedTimeEntries({
  timeEntries,
  timekeepers,
  roles,
  timekeeperRoles,
  matterId,
}: UseEnrichedTimeEntriesParams): EnrichedTimeEntry[] {
  return useMemo(() => {
    if (!timeEntries || !timekeepers || !roles || !timekeeperRoles) {
      return [];
    }

    return timeEntries.map((entry) => {
      // Find the timekeeper
      const timekeeper = timekeepers.find((tk) => tk.id === entry.timekeeperId);
      const timekeeperName = timekeeper?.name || "Unknown";

      // Find the timekeeper role for this matter and timekeeper
      const timekeeperRole = timekeeperRoles.find(
        (tr) =>
          tr.timekeeperId === entry.timekeeperId && tr.matterId === matterId
      );

      // Find the role name and billable rate
      let roleName = "N/A";
      let billableRate = 0;

      if (timekeeperRole) {
        const role = roles.find((r) => r.id === timekeeperRole.roleId);
        roleName = role?.name || "Unknown";
        billableRate = timekeeperRole.billableRate;
      }

      return {
        ...entry,
        timekeeperName,
        roleName,
        billableRate,
      };
    });
  }, [timeEntries, timekeepers, roles, timekeeperRoles, matterId]);
}

/**
 * Helper function to format currency in GBP.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}
