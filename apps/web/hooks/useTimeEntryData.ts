import { useQuery } from "@tanstack/react-query";
import type {
  Timekeeper,
  Role,
  TimekeeperRole,
  Matter,
  TimeEntry,
} from "@ai-starter/core";
import { api } from "../lib/api";

/**
 * Custom hook to fetch all data needed for displaying enriched time entries.
 * Fetches timekeepers, roles, timekeeper roles, matter details, and time entries.
 */
export function useTimeEntryData(matterId: string) {
  const {
    data: timekeepers,
    isLoading: isLoadingTimekeepers,
    error: timekeepersError,
  } = useQuery<Timekeeper[]>({
    queryKey: ["timekeepers"],
    queryFn: async () => {
      const response = await api.timekeepers.get();
      if (response.error) throw new Error("Failed to fetch timekeepers");
      return response.data as Timekeeper[];
    },
  });

  const {
    data: roles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.get();
      if (response.error) throw new Error("Failed to fetch roles");
      return response.data as Role[];
    },
  });

  const {
    data: timekeeperRoles,
    isLoading: isLoadingTimekeeperRoles,
    error: timekeeperRolesError,
  } = useQuery<TimekeeperRole[]>({
    queryKey: ["timekeeper-roles", matterId],
    queryFn: async () => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["timekeeper-roles"].get();
      if (response.error) throw new Error("Failed to fetch timekeeper roles");
      return response.data as TimekeeperRole[];
    },
  });

  const {
    data: matter,
    isLoading: isLoadingMatter,
    error: matterError,
  } = useQuery<Matter>({
    queryKey: ["matter", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).get();
      if (response.error) throw new Error("Failed to fetch matter");
      return response.data as Matter;
    },
  });

  const {
    data: timeEntries,
    isLoading: isLoadingTimeEntries,
    error: timeEntriesError,
  } = useQuery<TimeEntry[]>({
    queryKey: ["time-entries", matterId],
    queryFn: async () => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["time-entries"].get();
      if (response.error) throw new Error("Failed to fetch time entries");
      return response.data as TimeEntry[];
    },
  });

  const isLoading =
    isLoadingTimekeepers ||
    isLoadingRoles ||
    isLoadingTimekeeperRoles ||
    isLoadingMatter ||
    isLoadingTimeEntries;

  const error =
    timekeepersError ||
    rolesError ||
    timekeeperRolesError ||
    matterError ||
    timeEntriesError;

  return {
    timekeepers,
    roles,
    timekeeperRoles,
    matter,
    timeEntries,
    isLoading,
    error,
  };
}
