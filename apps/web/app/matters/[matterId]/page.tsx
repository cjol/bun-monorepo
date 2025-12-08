"use client";

import {
  Title,
  Text,
  Container,
  Paper,
  SimpleGrid,
  Group,
  Loader,
  Button,
  Table,
  Badge,
  ActionIcon,
  Anchor,
  Stack,
  Divider,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconClock,
  IconCurrencyPound,
  IconAlertCircle,
  IconHourglassHigh,
  IconSettings,
  IconEye,
  IconArrowRight,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";
import type { TimekeeperRole } from "@ai-starter/core";

const statusColors: Record<string, string> = {
  draft: "gray",
  finalized: "blue",
  sent: "yellow",
  paid: "green",
};

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

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ["bills", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).bills.get();
      if (response.error) throw new Error("Failed to fetch bills");
      return response.data;
    },
  });

  const { data: timeEntries, isLoading: timeEntriesLoading } = useQuery({
    queryKey: ["time-entries", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId })["time-entries"].get();
      if (response.error) throw new Error("Failed to fetch time entries");
      return response.data;
    },
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggestions", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).suggestions.get();
      if (response.error) throw new Error("Failed to fetch suggestions");
      return response.data;
    },
  });

  const { data: timekeeperRoles } = useQuery({
    queryKey: ["timekeeper-roles", matterId],
    queryFn: async () => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["timekeeper-roles"].get();
      if (response.error) throw new Error("Failed to fetch timekeeper roles");
      return response.data;
    },
  });

  const isLoading =
    matterLoading || billsLoading || timeEntriesLoading || suggestionsLoading;

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  // Calculate stats
  const draftBills = bills?.filter((b) => b.status === "draft").length || 0;

  // Unbilled entries (no billId)
  const unbilledEntries = timeEntries?.filter((e) => !e.billId) || [];
  const unbilledHours = unbilledEntries.reduce((sum, e) => sum + e.hours, 0);

  // Calculate unbilled value using timekeeper rates
  const timekeeperRateMap = new Map<string, number>();
  if (timekeeperRoles) {
    timekeeperRoles.forEach((tr: TimekeeperRole) => {
      timekeeperRateMap.set(tr.timekeeperId, tr.billableRate);
    });
  }
  const unbilledValue = unbilledEntries.reduce((sum, e) => {
    const rate = timekeeperRateMap.get(e.timekeeperId) || 0;
    return sum + e.hours * rate;
  }, 0);

  // Actionable guidance
  const pendingSuggestions =
    suggestions?.filter((s) => s.status === "pending").length || 0;
  // For now, pending external action is 0 - this can be enhanced later
  const pendingExternalAction = 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

  return (
    <Container size="xl">
      {/* Header with Configure link */}
      <Group justify="space-between" mb="xs" align="flex-start">
        <div>
          <Title order={1}>{matter?.clientName}</Title>
          <Text size="lg" c="dimmed" mb="xs">
            {matter?.matterName}
          </Text>
          {matter?.description && (
            <Text size="sm" c="dimmed" maw={600}>
              {matter.description}
            </Text>
          )}
        </div>
        <Button
          component={Link}
          href={`/matters/${matterId}/settings`}
          leftSection={<IconSettings size={16} />}
          variant="light"
        >
          Configure Matter
        </Button>
      </Group>

      <Divider my="lg" />

      {/* Stats Widgets */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconFileInvoice
              size={32}
              stroke={1.5}
              color="var(--mantine-color-blue-6)"
            />
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
            <IconClock
              size={32}
              stroke={1.5}
              color="var(--mantine-color-orange-6)"
            />
            <div>
              <Text size="xs" c="dimmed">
                Unbilled Time
              </Text>
              <Text size="xl" fw={700}>
                {unbilledHours.toFixed(1)} hrs
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconCurrencyPound
              size={32}
              stroke={1.5}
              color="var(--mantine-color-green-6)"
            />
            <div>
              <Text size="xs" c="dimmed">
                Unbilled Value
              </Text>
              <Text size="xl" fw={700}>
                {formatCurrency(unbilledValue)}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconAlertCircle
              size={32}
              stroke={1.5}
              color="var(--mantine-color-yellow-6)"
            />
            <div>
              <Text size="xs" c="dimmed">
                Requiring Approval
              </Text>
              <Text size="xl" fw={700}>
                {pendingSuggestions}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <IconHourglassHigh
              size={32}
              stroke={1.5}
              color="var(--mantine-color-grape-6)"
            />
            <div>
              <Text size="xs" c="dimmed">
                Pending External Action
              </Text>
              <Text size="xl" fw={700}>
                {pendingExternalAction}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Bills Section */}
      <Stack gap="lg">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Bills</Title>
          </Group>

          {!bills || bills.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              No bills found for this matter.
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Period Start</Table.Th>
                  <Table.Th>Period End</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bills.slice(0, 5).map((bill) => (
                  <Table.Tr key={bill.id}>
                    <Table.Td>
                      {new Date(bill.periodStart).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      {new Date(bill.periodEnd).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={statusColors[bill.status]}>
                        {bill.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle">
                          <IconEye size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>

        {/* Time Entries Link */}
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Title order={3}>Time Entries</Title>
              <Text size="sm" c="dimmed">
                {timeEntries?.length || 0} total entries •{" "}
                {unbilledEntries.length} unbilled
              </Text>
            </div>
            <Anchor
              component={Link}
              href={`/matters/${matterId}/time-entries`}
              fw={500}
            >
              <Group gap="xs">
                View all time entries
                <IconArrowRight size={16} />
              </Group>
            </Anchor>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}
