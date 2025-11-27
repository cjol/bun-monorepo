"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";
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
import { api } from "../../lib/api";

interface TimeEntryFormValues {
  matterId: string;
  timekeeperId: string;
  billId?: string;
  date: Date;
  hours: number;
  description: string;
}

export default function TimeEntriesPage() {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<TimeEntryFormValues>({
    initialValues: {
      matterId: "",
      timekeeperId: "",
      billId: "",
      date: new Date(),
      hours: 0,
      description: "",
    },
    validate: {
      matterId: (value) => (!value ? "Matter is required" : null),
      timekeeperId: (value) => (!value ? "Timekeeper is required" : null),
      hours: (value) => (value <= 0 ? "Hours must be greater than 0" : null),
      description: (value) => (!value ? "Description is required" : null),
    },
  });

  const { data: matters } = useQuery({
    queryKey: ["matters"],
    queryFn: async () => {
      const response = await api.matters.get();
      if (response.error) throw new Error("Failed to fetch matters");
      return response.data;
    },
  });

  const { data: timekeepers } = useQuery({
    queryKey: ["timekeepers"],
    queryFn: async () => {
      const response = await api.timekeepers.get();
      if (response.error) throw new Error("Failed to fetch timekeepers");
      return response.data;
    },
  });

  const { data: bills } = useQuery({
    queryKey: ["bills", selectedMatterId],
    queryFn: async () => {
      if (!selectedMatterId) return [];
      const response = await api
        .matters({ matterId: selectedMatterId })
        .bills.get();
      if (response.error) return [];
      return response.data;
    },
    enabled: !!selectedMatterId,
  });

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["time-entries", selectedMatterId],
    queryFn: async () => {
      if (!selectedMatterId) return [];
      const matterApi = api.matters({ matterId: selectedMatterId });
      const response = await matterApi["time-entries"].get();
      if (response.error) throw new Error("Failed to fetch time entries");
      return response.data;
    },
    enabled: !!selectedMatterId,
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (values: TimeEntryFormValues) => {
      const matterApi = api.matters({ matterId: values.matterId });
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

  const matterOptions =
    matters?.map((matter) => ({
      value: matter.id,
      label: `${matter.clientName} - ${matter.matterName}`,
    })) || [];

  const timekeeperOptions = Array.isArray(timekeepers)
    ? timekeepers.map((tk) => ({
        value: tk.id,
        label: `${tk.name} (${tk.email})`,
      }))
    : [];

  const billOptions =
    bills?.map((bill) => ({
      value: bill.id,
      label: `${new Date(bill.periodStart).toLocaleDateString()} - ${new Date(bill.periodEnd).toLocaleDateString()}`,
    })) || [];

  const handleSubmit = (values: TimeEntryFormValues) => {
    if (editingEntry && selectedMatterId) {
      updateTimeEntryMutation.mutate({
        matterId: selectedMatterId,
        id: editingEntry,
        values,
      });
    } else {
      createTimeEntryMutation.mutate(values);
    }
  };

  return (
    <AppShell>
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

        <Paper shadow="sm" p="md" radius="md" withBorder mb="lg">
          <Select
            label="Filter by Matter"
            placeholder="Select a matter"
            data={matterOptions}
            value={selectedMatterId}
            onChange={setSelectedMatterId}
            searchable
            clearable
          />
        </Paper>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          {isLoading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : !selectedMatterId ? (
            <Text c="dimmed" ta="center" py="xl">
              Select a matter to view time entries.
            </Text>
          ) : !timeEntries || timeEntries.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No time entries found for this matter.
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Hours</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {timeEntries.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>
                      {new Date(entry.date).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{entry.hours}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text lineClamp={2}>{entry.description}</Text>
                    </Table.Td>
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
      </Container>

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
              label="Matter"
              placeholder="Select matter"
              data={matterOptions}
              required
              searchable
              {...form.getInputProps("matterId")}
              onChange={(value) => {
                form.setFieldValue("matterId", value || "");
                setSelectedMatterId(value);
              }}
            />
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
    </AppShell>
  );
}
