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
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRobot,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { api } from "../../../../lib/api";
import type { Bill, Job, AiSuggestion } from "@ai-starter/core";
import { useTimeEntryData } from "../../../../hooks/useTimeEntryData";
import {
  useEnrichedTimeEntries,
  formatCurrency,
  type EnrichedTimeEntry,
} from "../../../../hooks/useEnrichedTimeEntries";
import { useMetadataFields } from "../../../../hooks/useMetadataFields";
import { useSuggestions } from "../../../../hooks/useSuggestions";
import { SuggestionDiff } from "../../../../components/SuggestionDiff";
import { SuggestionCycler } from "../../../../components/SuggestionCycler";

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
  const [jobsModalOpened, setJobsModalOpened] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
  const [suggestionIndices, setSuggestionIndices] = useState<
    Record<string, number>
  >({});
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

  // Fetch all required data (timeEntries now include jobs array)
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

  // Fetch suggestions for the matter
  const {
    suggestionsByTimeEntry,
    approveSuggestionMutation,
    rejectSuggestionMutation,
  } = useSuggestions(matterId);

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

  const getJobIconColor = (jobs: Job[]) => {
    if (jobs.some((job) => job.status === "running")) return "green";
    if (jobs.some((job) => job.status === "failed")) return "red";
    if (jobs.some((job) => job.status === "completed")) return "blue";
    return "gray"; // all pending
  };

  // Helper to get the current suggestion for a time entry
  const getCurrentSuggestion = (
    timeEntryId: string
  ): AiSuggestion | undefined => {
    const list = suggestionsByTimeEntry.get(timeEntryId);
    if (!list || list.length === 0) return undefined;
    const index = suggestionIndices[timeEntryId] || 0;
    return list[index];
  };

  // Helper to cycle through suggestions for a time entry
  const cycleSuggestion = (timeEntryId: string) => {
    const list = suggestionsByTimeEntry.get(timeEntryId);
    if (!list || list.length <= 1) return;

    setSuggestionIndices((prev) => {
      const currentIndex = prev[timeEntryId] || 0;
      const nextIndex = (currentIndex + 1) % list.length;
      return {
        ...prev,
        [timeEntryId]: nextIndex,
      };
    });
  };

  // Helper to get timekeeper name by ID
  const getTimekeeperName = (timekeeperId: string): string => {
    const timekeeper = timekeepers?.find((tk) => tk.id === timekeeperId);
    return timekeeper?.name || "Unknown";
  };

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
              {enrichedTimeEntries.map((entry: EnrichedTimeEntry) => {
                const suggestion = getCurrentSuggestion(entry.id);
                const suggestionsList = suggestionsByTimeEntry.get(entry.id);
                const currentSuggestionIndex = suggestionIndices[entry.id] || 0;

                return (
                  <Table.Tr
                    key={entry.id}
                    style={{
                      borderLeft: suggestion
                        ? "4px solid var(--mantine-color-yellow-6)"
                        : undefined,
                    }}
                  >
                    <Table.Td>
                      {suggestion &&
                      suggestion.suggestedChanges.date !== entry.date ? (
                        <SuggestionDiff
                          oldValue={entry.date}
                          newValue={suggestion.suggestedChanges.date}
                          formatValue={(date) =>
                            new Date(date).toLocaleDateString()
                          }
                          explanation={suggestion.explanation}
                        />
                      ) : (
                        new Date(entry.date).toLocaleDateString()
                      )}
                    </Table.Td>
                    <Table.Td>
                      {suggestion &&
                      suggestion.suggestedChanges.timekeeperId !==
                        entry.timekeeperId ? (
                        <SuggestionDiff
                          oldValue={entry.timekeeperName}
                          newValue={getTimekeeperName(
                            suggestion.suggestedChanges.timekeeperId
                          )}
                          explanation={suggestion.explanation}
                        />
                      ) : (
                        <Text fw={500}>{entry.timekeeperName}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text>{entry.roleName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{formatCurrency(entry.billableRate)}</Text>
                    </Table.Td>
                    <Table.Td>
                      {suggestion &&
                      suggestion.suggestedChanges.hours !== entry.hours ? (
                        <SuggestionDiff
                          oldValue={entry.hours}
                          newValue={suggestion.suggestedChanges.hours}
                          explanation={suggestion.explanation}
                        />
                      ) : (
                        <Text fw={500}>{entry.hours}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {suggestion &&
                      suggestion.suggestedChanges.description !==
                        entry.description ? (
                        <SuggestionDiff
                          oldValue={entry.description}
                          newValue={suggestion.suggestedChanges.description}
                          explanation={suggestion.explanation}
                        />
                      ) : (
                        <Text lineClamp={2}>{entry.description}</Text>
                      )}
                    </Table.Td>
                    {metadataFields.map((field) => {
                      const metadata = entry.metadata as Record<string, string>;
                      const value = metadata[field.key];
                      let displayValue = value || "-";

                      // For enum fields, show the readable name instead of the raw value
                      if (field.type === "enum" && value) {
                        const enumOption = field.values.find(
                          (v) => v.value === value
                        );
                        displayValue = enumOption?.name || value;
                      }

                      // Check if there's a suggestion for this metadata field
                      const suggestedMetadata = suggestion?.suggestedChanges
                        .metadata as Record<string, string>;
                      const suggestedValue = suggestedMetadata?.[field.key];
                      let suggestedDisplayValue = suggestedValue || "-";

                      if (field.type === "enum" && suggestedValue) {
                        const enumOption = field.values.find(
                          (v) => v.value === suggestedValue
                        );
                        suggestedDisplayValue =
                          enumOption?.name || suggestedValue;
                      }

                      const hasMetadataDiff =
                        suggestion && suggestedValue !== value;

                      return (
                        <Table.Td key={field.key}>
                          {hasMetadataDiff ? (
                            <SuggestionDiff
                              oldValue={displayValue}
                              newValue={suggestedDisplayValue}
                              explanation={suggestion?.explanation}
                            />
                          ) : (
                            <Text>{displayValue}</Text>
                          )}
                        </Table.Td>
                      );
                    })}
                    <Table.Td>
                      <Group gap="xs">
                        {suggestion && (
                          <>
                            {/* Suggestion cycler if multiple suggestions */}
                            {suggestionsList && suggestionsList.length > 1 && (
                              <SuggestionCycler
                                currentIndex={currentSuggestionIndex}
                                totalCount={suggestionsList.length}
                                onCycle={() => cycleSuggestion(entry.id)}
                              />
                            )}
                            {/* Approve button */}
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              onClick={() =>
                                approveSuggestionMutation.mutate(suggestion.id)
                              }
                              loading={approveSuggestionMutation.isPending}
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                            {/* Reject button */}
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                rejectSuggestionMutation.mutate(suggestion.id)
                              }
                              loading={rejectSuggestionMutation.isPending}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </>
                        )}
                        {entry.jobs && entry.jobs.length > 0 && (
                          <ActionIcon
                            variant="subtle"
                            color={getJobIconColor(entry.jobs)}
                            onClick={() => {
                              setSelectedJobs(entry.jobs || []);
                              setJobsModalOpened(true);
                            }}
                          >
                            <IconRobot size={16} />
                          </ActionIcon>
                        )}
                        <ActionIcon variant="subtle">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red">
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
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

      {/* Jobs Modal */}
      <Modal
        opened={jobsModalOpened}
        onClose={() => {
          setJobsModalOpened(false);
          setSelectedJobs([]);
        }}
        title="Related Jobs"
        size="xl"
      >
        <Stack gap="md">
          {selectedJobs.length === 0 ? (
            <Text c="dimmed" ta="center">
              No jobs found
            </Text>
          ) : (
            selectedJobs.map((job) => (
              <Paper key={job.id} p="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600} size="lg">
                      Job {job.id}
                    </Text>
                    <Text
                      size="sm"
                      c={
                        job.status === "completed"
                          ? "green"
                          : job.status === "failed"
                            ? "red"
                            : job.status === "running"
                              ? "blue"
                              : "gray"
                      }
                    >
                      {job.status.toUpperCase()}
                    </Text>
                  </Group>

                  <div>
                    <Text size="sm" fw={500} mb={4}>
                      Type:
                    </Text>
                    <Text size="sm" c="dimmed">
                      {job.type}
                    </Text>
                  </div>

                  {job.scheduledAt && (
                    <div>
                      <Text size="sm" fw={500} mb={4}>
                        Scheduled:
                      </Text>
                      <Text size="sm" c="dimmed">
                        {new Date(job.scheduledAt).toLocaleString()}
                      </Text>
                    </div>
                  )}

                  {job.startedAt && (
                    <div>
                      <Text size="sm" fw={500} mb={4}>
                        Started:
                      </Text>
                      <Text size="sm" c="dimmed">
                        {new Date(job.startedAt).toLocaleString()}
                      </Text>
                    </div>
                  )}

                  {job.finishedAt && (
                    <div>
                      <Text size="sm" fw={500} mb={4}>
                        Finished:
                      </Text>
                      <Text size="sm" c="dimmed">
                        {new Date(job.finishedAt).toLocaleString()}
                      </Text>
                    </div>
                  )}

                  {job.parameters !== null && job.parameters !== undefined && (
                    <div>
                      <Text size="sm" fw={500} mb={4}>
                        Parameters:
                      </Text>
                      <Paper p="xs" bg="gray.0" style={{ overflow: "auto" }}>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {JSON.stringify(
                            job.parameters,
                            (_key: string, value: unknown): unknown =>
                              typeof value === "bigint"
                                ? value.toString()
                                : value,
                            2
                          )}
                        </pre>
                      </Paper>
                    </div>
                  )}

                  {job.result !== null && job.result !== undefined && (
                    <div>
                      <Text size="sm" fw={500} mb={4}>
                        Result:
                      </Text>
                      <Paper p="xs" bg="gray.0" style={{ overflow: "auto" }}>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {JSON.stringify(
                            job.result,
                            (_key: string, value: unknown): unknown =>
                              typeof value === "bigint"
                                ? value.toString()
                                : value,
                            2
                          )}
                        </pre>
                      </Paper>
                    </div>
                  )}
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
