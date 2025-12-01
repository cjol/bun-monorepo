"use client";

import { useState } from "react";
import {
  Title,
  Container,
  Button,
  Table,
  Group,
  Text,
  ActionIcon,
  Modal,
  Stack,
  Loader,
  Paper,
  Badge,
  Select,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconEye } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { api } from "../../../../lib/api";

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

export default function BillsPage() {
  const [opened, setOpened] = useState(false);
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();

  const form = useForm<BillFormValues>({
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

  const { data: bills, isLoading } = useQuery({
    queryKey: ["bills", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).bills.get();
      if (response.error) throw new Error("Failed to fetch bills");
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
      setOpened(false);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create bill",
        color: "red",
      });
    },
  });

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Bills</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            form.reset();
            setOpened(true);
          }}
        >
          New Bill
        </Button>
      </Group>

      <Paper shadow="sm" p="md" radius="md" withBorder>
        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : !bills || bills.length === 0 ? (
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

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          form.reset();
        }}
        title="Create New Bill"
      >
        <form
          onSubmit={form.onSubmit((values) =>
            createBillMutation.mutate(values)
          )}
        >
          <Stack>
            <DatePickerInput
              label="Period Start"
              placeholder="Select date"
              required
              {...form.getInputProps("periodStart")}
            />
            <DatePickerInput
              label="Period End"
              placeholder="Select date"
              required
              {...form.getInputProps("periodEnd")}
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
              {...form.getInputProps("status")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setOpened(false);
                  form.reset();
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
