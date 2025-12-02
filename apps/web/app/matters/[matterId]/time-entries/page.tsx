"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Title,
  Container,
  Button,
  Table,
  Group,
  Text,
  ActionIcon,
  Modal,
  Textarea,
  Stack,
  Loader,
  Paper,
  Select,
  NumberInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { api } from "../../../../lib/api";
import type { Bill } from "@ai-starter/core";
import { useTimeEntryData } from "../../../../hooks/useTimeEntryData";
import {
  useEnrichedTimeEntries,
  formatCurrency,
  type EnrichedTimeEntry,
} from "../../../../hooks/useEnrichedTimeEntries";
import { useMetadataFields } from "../../../../hooks/useMetadataFields";

interface TimeEntryFormValues {
  timekeeperId: string;
  billId?: string;
  date: Date;
  hours: number;
  description: string;
}

export default function TimeEntriesPage() {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();

  const form = useForm<TimeEntryFormValues>({
    initialValues: {
      timekeeperId: "",
      billId: "",
      date: new Date(),
      hours: 0,
      description: "",
    },
    validate: {
      timekeeperId: (value) => (!value ? "Timekeeper is required" : null),
      hours: (value) => (value <= 0 ? "Hours must be greater than 0" : null),
      description: (value) => (!value ? "Description is required" : null),
    },
  });

  // Fetch all required data
  const {
    timekeepers,
    roles,
    timekeeperRoles,
    matter,
    timeEntries,
    isLoading,
  } = useTimeEntryData(matterId);

  // Fetch bills separately (not part of the time entry enrichment)
  const { data: bills } = useQuery({
    queryKey: ["bills", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).bills.get();
      if (response.error) return [];
      return response.data;
    },
  });

  // Enrich time entries with timekeeper, role, and rate information
  const enrichedTimeEntries = useEnrichedTimeEntries({
    timeEntries,
    timekeepers,
    roles,
    timekeeperRoles,
    matterId,
  });

  // Extract metadata fields from the matter schema
  const metadataFields = useMetadataFields(matter);

  const createTimeEntryMutation = useMutation({
    mutationFn: async (values: TimeEntryFormValues) => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["time-entries"].post({
        timekeeperId: values.timekeeperId,
        billId: values.billId || undefined,
        date: values.date.toISOString(),
        hours: values.hours,
        description: values.description,
      });
      if (response.error) throw new Error("Failed to create time entry");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      notifications.show({
        title: "Success",
        message: "Time entry created successfully",
        color: "green",
      });
      setOpened(false);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create time entry",
        color: "red",
      });
    },
  });

  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({
      matterId,
      id,
      values,
    }: {
      matterId: string;
      id: string;
      values: Partial<TimeEntryFormValues>;
    }) => {
      const matterApi = api.matters({ matterId });
      const timeEntryApi = matterApi["time-entries"]({ timeEntryId: id });
      const response = await timeEntryApi.patch({
        hours: values.hours,
        description: values.description,
        date: values.date?.toISOString(),
      });
      if (response.error) throw new Error("Failed to update time entry");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      notifications.show({
        title: "Success",
        message: "Time entry updated successfully",
        color: "green",
      });
      setOpened(false);
      setEditingEntry(null);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update time entry",
        color: "red",
      });
    },
  });

  const timekeeperOptions = Array.isArray(timekeepers)
    ? timekeepers.map((tk) => ({
        value: tk.id,
        label: `${tk.name} (${tk.email})`,
      }))
    : [];

  const billOptions =
    bills?.map((bill: Bill) => ({
      value: bill.id,
      label: `${new Date(bill.periodStart).toLocaleDateString()} - ${new Date(bill.periodEnd).toLocaleDateString()}`,
    })) || [];

  const handleSubmit = (values: TimeEntryFormValues) => {
    if (editingEntry) {
      updateTimeEntryMutation.mutate({
        matterId,
        id: editingEntry,
        values,
      });
    } else {
      createTimeEntryMutation.mutate(values);
    }
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Time Entries</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditingEntry(null);
            form.reset();
            setOpened(true);
          }}
        >
          New Entry
        </Button>
      </Group>

      <Paper shadow="sm" p="md" radius="md" withBorder>
        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : !enrichedTimeEntries || enrichedTimeEntries.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No time entries found for this matter.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Timekeeper</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Rate</Table.Th>
                <Table.Th>Hours</Table.Th>
                <Table.Th>Description</Table.Th>
                {metadataFields.map((field) => (
                  <Table.Th key={field.key}>{field.label}</Table.Th>
                ))}
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {enrichedTimeEntries.map((entry: EnrichedTimeEntry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>
                    {new Date(entry.date).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{entry.timekeeperName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{entry.roleName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{formatCurrency(entry.billableRate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{entry.hours}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text lineClamp={2}>{entry.description}</Text>
                  </Table.Td>
                  {metadataFields.map((field) => (
                    <Table.Td key={field.key}>
                      <Text>{entry.metadata?.[field.key] || "-"}</Text>
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditingEntry(null);
          form.reset();
        }}
        title={editingEntry ? "Edit Time Entry" : "Create New Time Entry"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Timekeeper"
              placeholder="Select timekeeper"
              data={timekeeperOptions}
              required
              searchable
              {...form.getInputProps("timekeeperId")}
            />
            <Select
              label="Bill (optional)"
              placeholder="Select bill"
              data={billOptions}
              searchable
              clearable
              {...form.getInputProps("billId")}
            />
            <DateTimePicker
              label="Date & Time"
              placeholder="Select date and time"
              required
              {...form.getInputProps("date")}
            />
            <NumberInput
              label="Hours"
              placeholder="2.5"
              required
              min={0}
              step={0.25}
              decimalScale={2}
              {...form.getInputProps("hours")}
            />
            <Textarea
              label="Description"
              placeholder="Description of work performed"
              required
              minRows={3}
              {...form.getInputProps("description")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setOpened(false);
                  setEditingEntry(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createTimeEntryMutation.isPending ||
                  updateTimeEntryMutation.isPending
                }
              >
                {editingEntry ? "Update" : "Create"} Entry
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
