"use client";

import {
  Title,
  Text,
  Container,
  Paper,
  SimpleGrid,
  Group,
  Loader,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconClock,
  IconSparkles,
  IconNote,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";

export default function MatterDashboardPage() {
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;

  const { data: matter, isLoading: matterLoading } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).get();
      if (response.error) throw new Error("Failed to fetch matter");
      return response.data;
    },
  });

  const { data: bills } = useQuery({
    queryKey: ["bills", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).bills.get();
      if (response.error) throw new Error("Failed to fetch bills");
      return response.data;
    },
  });

  const { data: timeEntries } = useQuery({
    queryKey: ["time-entries", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId })["time-entries"].get();
      if (response.error) throw new Error("Failed to fetch time entries");
      return response.data;
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).suggestions.get();
      if (response.error) throw new Error("Failed to fetch suggestions");
      return response.data;
    },
  });

  const { data: workflows } = useQuery({
    queryKey: ["workflows", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).workflows.get();
      if (response.error) throw new Error("Failed to fetch workflows");
      return response.data;
    },
  });

  if (matterLoading) {
    return (
      <Container size="xl">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  const draftBills = bills?.filter((b) => b.status === "draft").length || 0;
  const pendingSuggestions =
    suggestions?.filter((s) => s.status === "pending").length || 0;

  return (
    <Container size="xl">
      <Title order={1} mb="xs">
        {matter?.clientName}
      </Title>
      <Text size="lg" c="dimmed" mb="xl">
        {matter?.matterName}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconFileInvoice size={32} stroke={1.5} />
            <div>
              <Text size="xs" c="dimmed">
                Draft Bills
              </Text>
              <Text size="xl" fw={700}>
                {draftBills}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconClock size={32} stroke={1.5} />
            <div>
              <Text size="xs" c="dimmed">
                Time Entries
              </Text>
              <Text size="xl" fw={700}>
                {timeEntries?.length || 0}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconSparkles size={32} stroke={1.5} />
            <div>
              <Text size="xs" c="dimmed">
                Pending Suggestions
              </Text>
              <Text size="xl" fw={700}>
                {pendingSuggestions}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconNote size={32} stroke={1.5} />
            <div>
              <Text size="xs" c="dimmed">
                Workflows
              </Text>
              <Text size="xl" fw={700}>
                {workflows?.length || 0}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>
    </Container>
  );
}
