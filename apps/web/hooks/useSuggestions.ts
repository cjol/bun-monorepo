import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { api } from "../lib/api";
import type { AiSuggestion } from "@ai-starter/core";

/**
 * Custom hook to fetch and manage AI suggestions for a matter.
 * Provides approve/reject mutations and groups suggestions by time entry.
 */
export function useSuggestions(matterId: string) {
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["suggestions", matterId, "pending"],
    queryFn: async () => {
      const response = await api.matters({ matterId }).suggestions.get({
        query: { status: "pending" },
      });
      if (response.error) throw new Error("Failed to fetch suggestions");
      return response.data;
    },
  });

  // Group suggestions by timeEntryId and sort by createdAt (most recent first)
  const suggestionsByTimeEntry = useMemo(() => {
    const map = new Map<string, AiSuggestion[]>();
    suggestions?.forEach((suggestion) => {
      const list = map.get(suggestion.timeEntryId) || [];
      list.push(suggestion);
      map.set(suggestion.timeEntryId, list);
    });

    // Sort each list by createdAt descending (most recent first)
    map.forEach((list) =>
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );

    return map;
  }, [suggestions]);

  const approveSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await api
        .matters({ matterId })
        .suggestions({ suggestionId })
        .approve.post();
      if (response.error) throw new Error("Failed to approve suggestion");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      notifications.show({
        title: "Success",
        message: "Suggestion approved successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to approve suggestion",
        color: "red",
      });
    },
  });

  const rejectSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await api
        .matters({ matterId })
        .suggestions({ suggestionId })
        .reject.post();
      if (response.error) throw new Error("Failed to reject suggestion");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      notifications.show({
        title: "Success",
        message: "Suggestion rejected",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to reject suggestion",
        color: "red",
      });
    },
  });

  return {
    suggestions,
    suggestionsByTimeEntry,
    isLoading,
    approveSuggestionMutation,
    rejectSuggestionMutation,
  };
}
