"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Title,
  Container,
  Button,
  Group,
  Text,
  Modal,
  Textarea,
  Stack,
  Loader,
  Paper,
  Select,
  NumberInput,
  SimpleGrid,
  Card,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import { api } from "../../../../../lib/api";
import type { Bill, Job } from "@ai-starter/core";
import { useTimeEntryData } from "../../../../../hooks/useTimeEntryData";
import {
  useEnrichedTimeEntries,
  formatCurrency,
  type EnrichedTimeEntry,
} from "../../../../../hooks/useEnrichedTimeEntries";
import { useMetadataFields } from "../../../../../hooks/useMetadataFields";
import { useSuggestions } from "../../../../../hooks/useSuggestions";
import { TimeEntriesTable } from "../../../../../components/TimeEntriesTable";

interface TimeEntryFormValues {
  timekeeperId: string;
  billId?: string;
  date: Date;
  hours: number;
  description: string;
}

export default function BillDetailPage() {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [jobsModalOpened, setJobsModalOpened] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
  const [suggestionIndices, setSuggestionIndices] = useState<
    Record<string, number>
  >({});
  const params = useParams<{ matterId: string; billId: string }>();
  const matterId = params.matterId;
  const billId = params.billId;
  const queryClient = useQueryClient();

  const form = useForm<TimeEntryFormValues>({
    initialValues: {
      timekeeperId: "",
      billId: billId,
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

  // Fetch bill details
  const { data: bill, isLoading: isLoadingBill } = useQuery({
    queryKey: ["bill", billId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).bills({ billId }).get();
      if (response.error) throw new Error("Failed to fetch bill");
      return response.data as Bill;
    },
  });

  // Fetch time entries for this bill
  const { data: timeEntriesForBill, isLoading: isLoadingTimeEntries } =
    useQuery({
      queryKey: ["time-entries", matterId, { billId }],
      queryFn: async () => {
        const response = await api.matters({ matterId })["time-entries"].get({
          query: { billId },
        });
        if (response.error) throw new Error("Failed to fetch time entries");
        return response.data as (EnrichedTimeEntry & { jobs?: Job[] })[];
      },
      refetchInterval: 1000,
    });

  // Fetch all required data for enrichment
  const { timekeepers, roles, timekeeperRoles, matter } =
    useTimeEntryData(matterId);

  // Enrich time entries with timekeeper, role, and rate information
  const enrichedTimeEntries = useEnrichedTimeEntries({
    timeEntries: timeEntriesForBill,
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

  // Update bill status mutation
  const updateBillStatusMutation = useMutation({
    mutationFn: async (status: Bill["status"]) => {
      const response = await api.matters({ matterId }).bills({ billId }).patch({
        status,
      });
      if (response.error) throw new Error("Failed to update bill status");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      notifications.show({
        title: "Success",
        message: "Bill status updated successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update bill status",
        color: "red",
      });
    },
  });

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

  // Calculate bill summary
  const totalHours =
    enrichedTimeEntries?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
  const totalValue =
    enrichedTimeEntries?.reduce(
      (sum, entry) => sum + entry.hours * entry.billableRate,
      0
    ) || 0;
  const entryCount = enrichedTimeEntries?.length || 0;

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

  const isLoading = isLoadingBill || isLoadingTimeEntries;

  return (
    <Container size="xl">
      {isLoading ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : !bill ? (
        <Text c="dimmed" ta="center" py="xl">
          Bill not found.
        </Text>
      ) : (
        <>
          <Group justify="space-between" mb="xl">
            <div>
              <Title order={1}>
                Bill: {new Date(bill.periodStart).toLocaleDateString()} -{" "}
                {new Date(bill.periodEnd).toLocaleDateString()}
              </Title>
              <Group mt="sm">
                <Text>Status:</Text>
                <Select
                  value={bill.status}
                  onChange={(value) => {
                    if (value) {
                      updateBillStatusMutation.mutate(value as Bill["status"]);
                    }
                  }}
                  data={[
                    { value: "draft", label: "Draft" },
                    { value: "finalized", label: "Finalized" },
                    { value: "sent", label: "Sent" },
                    { value: "paid", label: "Paid" },
                  ]}
                  disabled={updateBillStatusMutation.isPending}
                />
              </Group>
            </div>
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

          {/* Summary Cards */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">
                Total Hours
              </Text>
              <Text size="xl" fw={600}>
                {totalHours.toFixed(1)}
              </Text>
            </Card>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">
                Total Value
              </Text>
              <Text size="xl" fw={600}>
                {formatCurrency(totalValue)}
              </Text>
            </Card>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Text size="sm" c="dimmed">
                Entries
              </Text>
              <Text size="xl" fw={600}>
                {entryCount}
              </Text>
            </Card>
          </SimpleGrid>

          {/* Time Entries Table */}
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Title order={2} mb="md">
              Time Entries
            </Title>
            {!enrichedTimeEntries || enrichedTimeEntries.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No time entries found for this bill.
              </Text>
            ) : (
              <TimeEntriesTable
                enrichedTimeEntries={enrichedTimeEntries}
                metadataFields={metadataFields}
                suggestionsByTimeEntry={suggestionsByTimeEntry}
                suggestionIndices={suggestionIndices}
                onCycleSuggestion={cycleSuggestion}
                onApproveSuggestion={(suggestionId) =>
                  approveSuggestionMutation.mutate(suggestionId)
                }
                onRejectSuggestion={(suggestionId) =>
                  rejectSuggestionMutation.mutate(suggestionId)
                }
                onViewJobs={(jobs) => {
                  setSelectedJobs(jobs);
                  setJobsModalOpened(true);
                }}
                isApprovePending={approveSuggestionMutation.isPending}
                isRejectPending={rejectSuggestionMutation.isPending}
                timekeepers={timekeepers}
              />
            )}
          </Paper>

          {/* Create/Edit Time Entry Modal */}
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

                      {job.parameters !== null &&
                        job.parameters !== undefined && (
                          <div>
                            <Text size="sm" fw={500} mb={4}>
                              Parameters:
                            </Text>
                            <Paper
                              p="xs"
                              bg="gray.0"
                              style={{ overflow: "auto" }}
                            >
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
                          <Paper
                            p="xs"
                            bg="gray.0"
                            style={{ overflow: "auto" }}
                          >
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
        </>
      )}
    </Container>
  );
}
