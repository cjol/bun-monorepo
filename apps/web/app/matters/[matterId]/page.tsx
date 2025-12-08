"use client";

import { useState } from "react";
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
  Modal,
  Stack,
  Select,
  Anchor,
  Box,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconFileInvoice,
  IconClock,
  IconSparkles,
  IconCurrencyPound,
  IconAlertCircle,
  IconSettings,
  IconPlus,
  IconEye,
  IconArrowRight,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";
import type { TimekeeperRole } from "@ai-starter/core";

interface BillFormValues {
  periodStart: Date;
  periodEnd: Date;
  status: "draft" | "finalized" | "sent" | "paid";
}

const statusColors = {
  draft: "gray",
  finalized: "blue",
  sent: "yellow",
  paid: "green",
};

export default function MatterDashboardPage() {
  const [billModalOpened, setBillModalOpened] = useState(false);
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();
  const router = useRouter();

  const billForm = useForm<BillFormValues>({
    initialValues: {
      periodStart: new Date(),
      periodEnd: new Date(),
      status: "draft",
    },
    validate: {
      periodStart: (value) => (!value ? "Start date is required" : null),
      periodEnd: (value) => (!value ? "End date is required" : null),
    },
  });

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
      const timekeeperRolesEndpoint = api.matters({ matterId })[
        "timekeeper-roles"
      ];
      const response = await timekeeperRolesEndpoint.get();
      if (response.error) throw new Error("Failed to fetch timekeeper roles");
      return response.data;
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (values: BillFormValues) => {
      const response = await api.matters({ matterId }).bills.post({
        periodStart: values.periodStart.toISOString(),
        periodEnd: values.periodEnd.toISOString(),
        status: values.status,
      });
      if (response.error) throw new Error("Failed to create bill");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      notifications.show({
        title: "Success",
        message: "Bill created successfully",
        color: "green",
      });
      setBillModalOpened(false);
      billForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create bill",
        color: "red",
      });
    },
  });

  if (
    matterLoading ||
    billsLoading ||
    timeEntriesLoading ||
    suggestionsLoading
  ) {
    return (
      <Container size="xl">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  // Calculate unbilled time and value
  const unbilledTimeEntries =
    timeEntries?.filter((entry) => !entry.billId) || [];
  const unbilledHours = unbilledTimeEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0
  );

  // Calculate unbilled value using timekeeper roles for rates
  const timekeeperRolesArray: TimekeeperRole[] = Array.isArray(timekeeperRoles)
    ? timekeeperRoles
    : [];
  const ratesMap = new Map(
    timekeeperRolesArray.map((tr) => [tr.timekeeperId, tr.billableRate])
  );

  const unbilledValue = unbilledTimeEntries.reduce((sum, entry) => {
    const rate = ratesMap.get(entry.timekeeperId) || 0;
    return sum + entry.hours * rate;
  }, 0);

  // Count actionable items
  const draftBills = bills?.filter((b) => b.status === "draft").length || 0;
  const pendingSuggestions =
    suggestions?.filter((s) => s.status === "pending").length || 0;

  // For now, "pending external action" is a placeholder (could be jobs waiting for email, etc.)
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  const pendingExternalAction: number = 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

  return (
    <Container size="xl">
      {/* Header with Configure link */}
      <Group justify="space-between" mb="xs">
        <Title order={1}>{matter?.clientName}</Title>
        <Button
          variant="subtle"
          leftSection={<IconSettings size={18} />}
          component={Link}
          href={`/matters/${matterId}/settings`}
        >
          Configure Matter
        </Button>
      </Group>
      <Text size="lg" fw={500} mb="xs">
        {matter?.matterName}
      </Text>
      {matter?.description && (
        <Text size="md" c="dimmed" mb="xl">
          {matter.description}
        </Text>
      )}
      {!matter?.description && <Box mb="xl" />}

      {/* Stats Widgets */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
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
              color="var(--mantine-color-teal-6)"
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
            <IconSparkles
              size={32}
              stroke={1.5}
              color="var(--mantine-color-yellow-6)"
            />
            <div>
              <Text size="xs" c="dimmed">
                Requires Approval
              </Text>
              <Text size="xl" fw={700}>
                {pendingSuggestions}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Actionable Guidance Section */}
      {(pendingSuggestions > 0 || pendingExternalAction > 0) && (
        <Paper shadow="sm" p="md" radius="md" withBorder mb="xl" bg="yellow.0">
          <Group gap="xs" mb="sm">
            <IconAlertCircle size={20} color="var(--mantine-color-yellow-7)" />
            <Text fw={600} c="yellow.8">
              Actionable Guidance
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {pendingSuggestions > 0 && (
              <Paper p="sm" radius="sm" withBorder bg="white">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      {pendingSuggestions} suggestion
                      {pendingSuggestions !== 1 ? "s" : ""} requiring approval
                    </Text>
                    <Text size="xs" c="dimmed">
                      Review AI-suggested changes to time entries
                    </Text>
                  </div>
                  <Button
                    size="xs"
                    variant="light"
                    component={Link}
                    href={`/matters/${matterId}/time-entries`}
                    rightSection={<IconArrowRight size={14} />}
                  >
                    Review
                  </Button>
                </Group>
              </Paper>
            )}
            {pendingExternalAction > 0 && (
              <Paper p="sm" radius="sm" withBorder bg="white">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      {pendingExternalAction} item
                      {pendingExternalAction !== 1 ? "s" : ""} pending external
                      action
                    </Text>
                    <Text size="xs" c="dimmed">
                      Waiting for response from external parties
                    </Text>
                  </div>
                </Group>
              </Paper>
            )}
          </SimpleGrid>
        </Paper>
      )}

      {/* Bills Table */}
      <Paper shadow="sm" p="md" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Bills</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            size="sm"
            onClick={() => {
              billForm.reset();
              setBillModalOpened(true);
            }}
          >
            New Bill
          </Button>
        </Group>

        {!bills || bills.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
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
              {bills.map((bill) => (
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
                      <ActionIcon
                        variant="subtle"
                        onClick={() =>
                          router.push(`/matters/${matterId}/bills/${bill.id}`)
                        }
                      >
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

      {/* Link to all time entries */}
      <Group justify="center">
        <Anchor
          component={Link}
          href={`/matters/${matterId}/time-entries`}
          size="sm"
        >
          View all time entries →
        </Anchor>
      </Group>

      {/* Create Bill Modal */}
      <Modal
        opened={billModalOpened}
        onClose={() => {
          setBillModalOpened(false);
          billForm.reset();
        }}
        title="Create New Bill"
      >
        <form
          onSubmit={billForm.onSubmit((values) =>
            createBillMutation.mutate(values)
          )}
        >
          <Stack>
            <DatePickerInput
              label="Period Start"
              placeholder="Select date"
              required
              {...billForm.getInputProps("periodStart")}
            />
            <DatePickerInput
              label="Period End"
              placeholder="Select date"
              required
              {...billForm.getInputProps("periodEnd")}
            />
            <Select
              label="Status"
              data={[
                { value: "draft", label: "Draft" },
                { value: "finalized", label: "Finalized" },
                { value: "sent", label: "Sent" },
                { value: "paid", label: "Paid" },
              ]}
              required
              {...billForm.getInputProps("status")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setBillModalOpened(false);
                  billForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createBillMutation.isPending}>
                Create Bill
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
