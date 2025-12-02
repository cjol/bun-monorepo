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
  Select,
  NumberInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { api } from "../../../../lib/api";

interface TimekeeperRoleFormValues {
  timekeeperId: string;
  role: string;
  billableRate: number;
}

export default function TimekeeperRolesPage() {
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();

  const form = useForm<TimekeeperRoleFormValues>({
    initialValues: {
      timekeeperId: "",
      role: "",
      billableRate: 0,
    },
    validate: {
      timekeeperId: (value) => (!value ? "Timekeeper is required" : null),
      role: (value) => (!value ? "Role is required" : null),
      billableRate: (value) =>
        value <= 0 ? "Billable rate must be greater than 0" : null,
    },
  });

  const { data: timekeeperRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["timekeeperRoles", matterId],
    queryFn: async () => {
      const rolesEndpoint = api.matters({ matterId })["timekeeper-roles"];
      const response = await rolesEndpoint.get();
      if (response.error) throw new Error("Failed to fetch timekeeper roles");
      return response.data;
    },
  });

  const { data: timekeepers, isLoading: isLoadingTimekeepers } = useQuery({
    queryKey: ["timekeepers"],
    queryFn: async () => {
      const response = await api.timekeepers.get();
      if (response.error) throw new Error("Failed to fetch timekeepers");
      return response.data;
    },
  });

  const createTimekeeperRoleMutation = useMutation({
    mutationFn: async (values: TimekeeperRoleFormValues) => {
      const rolesEndpoint = api.matters({ matterId })["timekeeper-roles"];
      const response = await rolesEndpoint.post(values);
      if (response.error) throw new Error("Failed to create timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Timekeeper role created successfully",
        color: "green",
      });
      setOpened(false);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create timekeeper role",
        color: "red",
      });
    },
  });

  const updateTimekeeperRoleMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<TimekeeperRoleFormValues>;
    }) => {
      const rolesEndpoint = api.matters({ matterId })["timekeeper-roles"];
      const roleEndpoint = rolesEndpoint({ roleId: id });
      const response = await roleEndpoint.patch(values);
      if (response.error) throw new Error("Failed to update timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Timekeeper role updated successfully",
        color: "green",
      });
      setOpened(false);
      setEditingRoleId(null);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update timekeeper role",
        color: "red",
      });
    },
  });

  const deleteTimekeeperRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const rolesEndpoint = api.matters({ matterId })["timekeeper-roles"];
      const roleEndpoint = rolesEndpoint({ roleId });
      const response = await roleEndpoint.delete();
      if (response.error) throw new Error("Failed to delete timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Timekeeper role deleted successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to delete timekeeper role",
        color: "red",
      });
    },
  });

  const handleEdit = (role: {
    id: string;
    timekeeperId: string;
    role: string;
    billableRate: number;
  }) => {
    setEditingRoleId(role.id);
    form.setValues({
      timekeeperId: role.timekeeperId,
      role: role.role,
      billableRate: role.billableRate,
    });
    setOpened(true);
  };

  const handleSubmit = (values: TimekeeperRoleFormValues) => {
    if (editingRoleId) {
      updateTimekeeperRoleMutation.mutate({ id: editingRoleId, values });
    } else {
      createTimekeeperRoleMutation.mutate(values);
    }
  };

  const handleDelete = (roleId: string) => {
    if (
      confirm(
        "Are you sure you want to remove this timekeeper from the matter?"
      )
    ) {
      deleteTimekeeperRoleMutation.mutate(roleId);
    }
  };

  const timekeeperRolesArray = Array.isArray(timekeeperRoles)
    ? timekeeperRoles
    : [];
  const timekeepersArray = Array.isArray(timekeepers) ? timekeepers : [];

  // Create a map of timekeeper IDs to names for display
  const timekeeperMap = new Map(timekeepersArray.map((tk) => [tk.id, tk.name]));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Team Members</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditingRoleId(null);
            form.reset();
            setOpened(true);
          }}
        >
          Add Team Member
        </Button>
      </Group>

      <Paper shadow="sm" p="md" radius="md" withBorder>
        {isLoadingRoles || isLoadingTimekeepers ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : timekeeperRolesArray.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No team members assigned to this matter yet.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Timekeeper</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Billable Rate</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {timekeeperRolesArray.map((timekeeperRole) => (
                <Table.Tr key={timekeeperRole.id}>
                  <Table.Td>
                    <Text fw={500}>
                      {timekeeperMap.get(timekeeperRole.timekeeperId) ||
                        "Unknown"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{timekeeperRole.role}</Table.Td>
                  <Table.Td>${timekeeperRole.billableRate}/hr</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleEdit(timekeeperRole)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(timekeeperRole.id)}
                      >
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
          setEditingRoleId(null);
          form.reset();
        }}
        title={editingRoleId ? "Edit Team Member" : "Add Team Member"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Timekeeper"
              placeholder="Select a timekeeper"
              data={timekeepersArray.map((tk) => ({
                value: tk.id,
                label: `${tk.name} (${tk.email})`,
              }))}
              required
              searchable
              disabled={!!editingRoleId}
              {...form.getInputProps("timekeeperId")}
            />
            <TextInput
              label="Role"
              placeholder="e.g. Partner, Associate, Paralegal"
              required
              {...form.getInputProps("role")}
            />
            <NumberInput
              label="Billable Rate (per hour)"
              placeholder="Enter hourly rate"
              prefix="$"
              min={0}
              decimalScale={2}
              required
              {...form.getInputProps("billableRate")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setOpened(false);
                  setEditingRoleId(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createTimekeeperRoleMutation.isPending ||
                  updateTimekeeperRoleMutation.isPending
                }
              >
                {editingRoleId ? "Update" : "Add"} Team Member
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
