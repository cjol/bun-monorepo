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
  TextInput,
  Stack,
  Loader,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconEdit } from "@tabler/icons-react";
import { api } from "../../lib/api";

interface TimekeeperFormValues {
  name: string;
  email: string;
  matterId: string;
  roleId: string;
}

export default function TimekeepersPage() {
  const [editingTimekeeper, setEditingTimekeeper] = useState<string | null>(
    null
  );
  const [opened, setOpened] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<TimekeeperFormValues>({
    initialValues: {
      name: "",
      email: "",
      matterId: "",
      roleId: "550e8400-e29b-41d4-a716-446655440001", // Associate role UUID
    },
    validate: {
      name: (value) => (!value ? "Name is required" : null),
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+$/.test(value)) return "Invalid email";
        return null;
      },
      matterId: (value) => (!value ? "Matter is required" : null),
    },
  });

  const { data: timekeepers, isLoading } = useQuery({
    queryKey: ["timekeepers"],
    queryFn: async () => {
      const response = await api.timekeepers.get();
      if (response.error) throw new Error("Failed to fetch timekeepers");
      return response.data;
    },
  });

  const createTimekeeperMutation = useMutation({
    mutationFn: async (values: TimekeeperFormValues) => {
      const response = await api.timekeepers.post(values);
      if (response.error) throw new Error("Failed to create timekeeper");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeepers"] });
      notifications.show({
        title: "Success",
        message: "Timekeeper created successfully",
        color: "green",
      });
      setOpened(false);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create timekeeper",
        color: "red",
      });
    },
  });

  const updateTimekeeperMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<TimekeeperFormValues>;
    }) => {
      const response = await api
        .timekeepers({ timekeeperId: id })
        .patch(values);
      if (response.error) throw new Error("Failed to update timekeeper");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeepers"] });
      notifications.show({
        title: "Success",
        message: "Timekeeper updated successfully",
        color: "green",
      });
      setOpened(false);
      setEditingTimekeeper(null);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update timekeeper",
        color: "red",
      });
    },
  });

  const handleEdit = (timekeeper: {
    id: string;
    name: string;
    email: string;
    matterId: string;
    roleId: string;
  }) => {
    setEditingTimekeeper(timekeeper.id);
    form.setValues({
      name: timekeeper.name,
      email: timekeeper.email,
      matterId: timekeeper.matterId,
      roleId: timekeeper.roleId,
    });
    setOpened(true);
  };

  const handleSubmit = (values: TimekeeperFormValues) => {
    if (editingTimekeeper) {
      updateTimekeeperMutation.mutate({ id: editingTimekeeper, values });
    } else {
      createTimekeeperMutation.mutate(values);
    }
  };

  const timekeepersArray = Array.isArray(timekeepers) ? timekeepers : [];

  return (
    <AppShell>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <Title order={1}>Timekeepers</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditingTimekeeper(null);
              form.reset();
              setOpened(true);
            }}
          >
            New Timekeeper
          </Button>
        </Group>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          {isLoading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : timekeepersArray.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No timekeepers found. Create your first timekeeper to get started.
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {timekeepersArray.map((timekeeper) => (
                  <Table.Tr key={timekeeper.id}>
                    <Table.Td>
                      <Text fw={500}>{timekeeper.name}</Text>
                    </Table.Td>
                    <Table.Td>{timekeeper.email}</Table.Td>
                    <Table.Td>
                      {new Date(timekeeper.createdAt).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEdit(timekeeper)}
                        >
                          <IconEdit size={16} />
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
          setEditingTimekeeper(null);
          form.reset();
        }}
        title={editingTimekeeper ? "Edit Timekeeper" : "Create New Timekeeper"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="Jane Smith"
              required
              {...form.getInputProps("name")}
            />
            <TextInput
              label="Email"
              placeholder="jane.smith@firm.com"
              required
              type="email"
              {...form.getInputProps("email")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setOpened(false);
                  setEditingTimekeeper(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createTimekeeperMutation.isPending ||
                  updateTimekeeperMutation.isPending
                }
              >
                {editingTimekeeper ? "Update" : "Create"} Timekeeper
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </AppShell>
  );
}
