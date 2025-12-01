"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Title,
  Container,
  Button,
  Group,
  Text,
  Loader,
  Paper,
  Select,
  Badge,
  Card,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconX } from "@tabler/icons-react";
import { api } from "../../../../lib/api";
import type { AiSuggestion } from "@ai-starter/core";

const statusColors = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

export default function SuggestionsPage() {
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["suggestions", matterId, statusFilter],
    queryFn: async () => {
      const response = statusFilter
        ? await api.matters({ matterId }).suggestions.get({
            query: {
              status: statusFilter as "pending" | "approved" | "rejected",
            },
          })
        : await api.matters({ matterId }).suggestions.get();
      if (response.error) throw new Error("Failed to fetch suggestions");
      return response.data;
    },
  });

  const approveSuggestionMutation = useMutation({
    mutationFn: async ({ matterId, id }: { matterId: string; id: string }) => {
      const response = await api
        .matters({ matterId })
        .suggestions({ suggestionId: id })
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
    mutationFn: async ({ matterId, id }: { matterId: string; id: string }) => {
      const response = await api
        .matters({ matterId })
        .suggestions({ suggestionId: id })
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

  return (
    <Container size="xl">
      <Title order={1} mb="xl">
        AI Suggestions
      </Title>

      <Paper shadow="sm" p="md" radius="md" withBorder mb="lg">
        <Select
          label="Filter by Status"
          placeholder="All statuses"
          data={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
        />
      </Paper>

      <Paper shadow="sm" p="md" radius="md" withBorder>
        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : !suggestions || suggestions.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No suggestions found.
          </Text>
        ) : (
          <Stack gap="md">
            {suggestions.map((suggestion: AiSuggestion) => (
              <Card key={suggestion.id} shadow="xs" padding="md" withBorder>
                <Group justify="space-between" mb="sm">
                  <Badge
                    color={
                      statusColors[
                        suggestion.status as keyof typeof statusColors
                      ]
                    }
                  >
                    {suggestion.status}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {new Date(suggestion.createdAt).toLocaleString()}
                  </Text>
                </Group>

                <Text size="sm" fw={500} mb="xs">
                  Suggested Changes:
                </Text>
                <Card bg="gray.0" p="sm" mb="md">
                  <Text size="sm" mb="xs">
                    <strong>Hours:</strong> {suggestion.suggestedChanges.hours}
                  </Text>
                  <Text size="sm">
                    <strong>Description:</strong>{" "}
                    {suggestion.suggestedChanges.description}
                  </Text>
                </Card>

                {suggestion.status === "pending" && (
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="green"
                      leftSection={<IconCheck size={14} />}
                      onClick={() =>
                        approveSuggestionMutation.mutate({
                          matterId: matterId,
                          id: suggestion.id,
                        })
                      }
                      loading={approveSuggestionMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="outline"
                      leftSection={<IconX size={14} />}
                      onClick={() =>
                        rejectSuggestionMutation.mutate({
                          matterId: matterId,
                          id: suggestion.id,
                        })
                      }
                      loading={rejectSuggestionMutation.isPending}
                    >
                      Reject
                    </Button>
                  </Group>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
