"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Title,
  Text,
  Container,
  Paper,
  Group,
  Loader,
  SimpleGrid,
  Card,
  ThemeIcon,
  Stack,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Button,
  Badge,
  Divider,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileSpreadsheet,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { api } from "../../../../lib/api";
import type { Workflow } from "@ai-starter/core";
import { workflowTriggerSchema } from "@ai-starter/core/schema/workflow";

// Hard-coded context documents for display purposes
const CONTEXT_DOCUMENTS = [
  {
    id: "1",
    name: "Client Billing Guidelines",
    type: "pdf",
    description:
      "Standard billing requirements and rate structures for this client",
  },
  {
    id: "2",
    name: "Firm Billing Guidelines",
    type: "doc",
    description: "Internal firm policies for time entry and billing practices",
  },
  {
    id: "3",
    name: "Matter Budget Tracker",
    type: "xlsx",
    description: "Budget allocations and spending tracking for this matter",
  },
  {
    id: "4",
    name: "Outside Counsel Guidelines",
    type: "pdf",
    description: "Client-specific rules for outside counsel engagement",
  },
];

const fileIcons = {
  pdf: IconFileTypePdf,
  doc: IconFileTypeDoc,
  xlsx: IconFileSpreadsheet,
  default: IconFile,
};

const fileColors = {
  pdf: "red",
  doc: "blue",
  xlsx: "green",
  default: "gray",
};

interface TimekeeperRoleFormValues {
  timekeeperId: string;
  roleId: string;
  billableRate: number;
}

interface WorkflowFormValues {
  name: string;
  instructions: string;
  trigger: typeof workflowTriggerSchema._output;
}

export default function MatterSettingsPage() {
  const [timekeeperModalOpened, setTimekeeperModalOpened] = useState(false);
  const [editingTimekeeperRoleId, setEditingTimekeeperRoleId] = useState<
    string | null
  >(null);
  const [workflowModalOpened, setWorkflowModalOpened] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null
  );
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();

  const timekeeperForm = useForm<TimekeeperRoleFormValues>({
    initialValues: {
      timekeeperId: "",
      roleId: "",
      billableRate: 0,
    },
    validate: {
      timekeeperId: (value) => (!value ? "Timekeeper is required" : null),
      roleId: (value) => (!value ? "Role is required" : null),
      billableRate: (value) =>
        value <= 0 ? "Billable rate must be greater than 0" : null,
    },
  });

  const workflowForm = useForm<WorkflowFormValues>({
    initialValues: {
      name: "",
      instructions: "",
      trigger: workflowTriggerSchema.options[0],
    },
    validate: {
      name: (value) => (!value ? "Name is required" : null),
      instructions: (value) => (!value ? "Instructions are required" : null),
      trigger: (value) => (!value ? "Trigger is required" : null),
    },
  });

  // Fetch matter details
  const { data: matter, isLoading: matterLoading } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).get();
      if (response.error) throw new Error("Failed to fetch matter");
      return response.data;
    },
  });

  // Fetch timekeeper roles for this matter
  const { data: timekeeperRoles, isLoading: isLoadingTimekeeperRoles } =
    useQuery({
      queryKey: ["timekeeperRoles", matterId],
      queryFn: async () => {
        const timekeeperRolesEndpoint = api.matters({ matterId })[
          "timekeeper-roles"
        ];
        const response = await timekeeperRolesEndpoint.get();
        if (response.error) throw new Error("Failed to fetch timekeeper roles");
        return response.data;
      },
    });

  // Fetch all timekeepers
  const { data: timekeepers, isLoading: isLoadingTimekeepers } = useQuery({
    queryKey: ["timekeepers"],
    queryFn: async () => {
      const response = await api.timekeepers.get();
      if (response.error) throw new Error("Failed to fetch timekeepers");
      return response.data;
    },
  });

  // Fetch all roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.get();
      if (response.error) throw new Error("Failed to fetch roles");
      return response.data;
    },
  });

  // Fetch workflows for this matter
  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ["workflows", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).workflows.get();
      if (response.error) throw new Error("Failed to fetch workflows");
      return response.data;
    },
  });

  // Timekeeper role mutations
  const createTimekeeperRoleMutation = useMutation({
    mutationFn: async (values: TimekeeperRoleFormValues) => {
      const timekeeperRolesEndpoint = api.matters({ matterId })[
        "timekeeper-roles"
      ];
      const response = await timekeeperRolesEndpoint.post(values);
      if (response.error) throw new Error("Failed to create timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Team member added successfully",
        color: "green",
      });
      setTimekeeperModalOpened(false);
      timekeeperForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to add team member",
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
      const timekeeperRolesEndpoint = api.matters({ matterId })[
        "timekeeper-roles"
      ];
      const response = await timekeeperRolesEndpoint({ roleId: id }).patch(
        values
      );
      if (response.error) throw new Error("Failed to update timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Team member updated successfully",
        color: "green",
      });
      setTimekeeperModalOpened(false);
      setEditingTimekeeperRoleId(null);
      timekeeperForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update team member",
        color: "red",
      });
    },
  });

  const deleteTimekeeperRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const timekeeperRolesEndpoint = api.matters({ matterId })[
        "timekeeper-roles"
      ];
      const response = await timekeeperRolesEndpoint({ roleId }).delete();
      if (response.error) throw new Error("Failed to delete timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Team member removed successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to remove team member",
        color: "red",
      });
    },
  });

  // Workflow mutations
  const createWorkflowMutation = useMutation({
    mutationFn: async (values: WorkflowFormValues) => {
      const response = await api.matters({ matterId }).workflows.post({
        name: values.name,
        instructions: values.instructions,
        trigger: values.trigger,
      });
      if (response.error) throw new Error("Failed to create workflow");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notifications.show({
        title: "Success",
        message: "Workflow created successfully",
        color: "green",
      });
      setWorkflowModalOpened(false);
      workflowForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create workflow",
        color: "red",
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<WorkflowFormValues>;
    }) => {
      const response = await api
        .matters({ matterId })
        .workflows({ workflowId: id })
        .patch(values);
      if (response.error) throw new Error("Failed to update workflow");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notifications.show({
        title: "Success",
        message: "Workflow updated successfully",
        color: "green",
      });
      setWorkflowModalOpened(false);
      setEditingWorkflowId(null);
      workflowForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update workflow",
        color: "red",
      });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api
        .matters({ matterId })
        .workflows({ workflowId: id })
        .delete();
      if (response.error) throw new Error("Failed to delete workflow");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notifications.show({
        title: "Success",
        message: "Workflow deleted successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to delete workflow",
        color: "red",
      });
    },
  });

  const handleEditTimekeeperRole = (role: {
    id: string;
    timekeeperId: string;
    roleId: string;
    billableRate: number;
  }) => {
    setEditingTimekeeperRoleId(role.id);
    timekeeperForm.setValues({
      timekeeperId: role.timekeeperId,
      roleId: role.roleId,
      billableRate: role.billableRate,
    });
    setTimekeeperModalOpened(true);
  };

  const handleDeleteTimekeeperRole = (roleId: string) => {
    modals.openConfirmModal({
      title: "Remove Team Member",
      children: (
        <Text>
          Are you sure you want to remove this team member from the matter?
        </Text>
      ),
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteTimekeeperRoleMutation.mutate(roleId),
    });
  };

  const handleTimekeeperSubmit = (values: TimekeeperRoleFormValues) => {
    if (editingTimekeeperRoleId) {
      updateTimekeeperRoleMutation.mutate({
        id: editingTimekeeperRoleId,
        values,
      });
    } else {
      createTimekeeperRoleMutation.mutate(values);
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflowId(workflow.id);
    workflowForm.setValues({
      name: workflow.name,
      instructions: workflow.instructions,
      trigger: workflow.trigger as typeof workflowTriggerSchema._output,
    });
    setWorkflowModalOpened(true);
  };

  const handleDeleteWorkflow = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Workflow",
      children: (
        <Text>
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteWorkflowMutation.mutate(id),
    });
  };

  const handleWorkflowSubmit = (values: WorkflowFormValues) => {
    if (editingWorkflowId) {
      updateWorkflowMutation.mutate({ id: editingWorkflowId, values });
    } else {
      createWorkflowMutation.mutate(values);
    }
  };

  const timekeeperRolesArray = Array.isArray(timekeeperRoles)
    ? timekeeperRoles
    : [];
  const timekeepersArray = Array.isArray(timekeepers) ? timekeepers : [];
  const rolesArray = Array.isArray(roles) ? roles : [];
  const workflowsArray = Array.isArray(workflows) ? workflows : [];

  const timekeeperMap = new Map(timekeepersArray.map((tk) => [tk.id, tk.name]));
  const roleMap = new Map(rolesArray.map((r) => [r.id, r.name]));

  if (matterLoading) {
    return (
      <Container size="xl">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title order={1} mb="xl">
        Matter Settings
      </Title>

      {/* Matter Details */}
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">
          Matter Details
        </Title>
        <Stack gap="sm">
          <Group>
            <Text fw={500} w={120}>
              Client:
            </Text>
            <Text>{matter?.clientName}</Text>
          </Group>
          <Group>
            <Text fw={500} w={120}>
              Matter:
            </Text>
            <Text>{matter?.matterName}</Text>
          </Group>
          {matter?.description && (
            <Group align="flex-start">
              <Text fw={500} w={120}>
                Description:
              </Text>
              <Text style={{ flex: 1 }}>{matter.description}</Text>
            </Group>
          )}
          {matter?.timeEntryMetadataSchema && (
            <Group align="flex-start">
              <Text fw={500} w={120}>
                Metadata Fields:
              </Text>
              <Group gap="xs">
                {Object.entries(matter.timeEntryMetadataSchema).map(
                  ([key, field]) => (
                    <Badge key={key} variant="light">
                      {field.name}
                    </Badge>
                  )
                )}
              </Group>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Context Documents */}
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">
          Context Documents
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Reference documents that provide context for billing and workflow
          decisions.
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {CONTEXT_DOCUMENTS.map((doc) => {
            const IconComponent =
              fileIcons[doc.type as keyof typeof fileIcons] ||
              fileIcons.default;
            const iconColor =
              fileColors[doc.type as keyof typeof fileColors] ||
              fileColors.default;
            return (
              <Card
                key={doc.id}
                shadow="xs"
                padding="md"
                radius="md"
                withBorder
              >
                <Group wrap="nowrap">
                  <ThemeIcon
                    size="xl"
                    radius="md"
                    variant="light"
                    color={iconColor}
                  >
                    <IconComponent size={24} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {doc.name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {doc.description}
                    </Text>
                  </div>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      </Paper>

      {/* Team Members / Timekeepers */}
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Team Members</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            size="sm"
            onClick={() => {
              setEditingTimekeeperRoleId(null);
              timekeeperForm.reset();
              setTimekeeperModalOpened(true);
            }}
          >
            Add Team Member
          </Button>
        </Group>

        {isLoadingTimekeeperRoles || isLoadingTimekeepers || isLoadingRoles ? (
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
                  <Table.Td>
                    {roleMap.get(timekeeperRole.roleId) || "Unknown"}
                  </Table.Td>
                  <Table.Td>£{timekeeperRole.billableRate}/hr</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleEditTimekeeperRole(timekeeperRole)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          handleDeleteTimekeeperRole(timekeeperRole.id)
                        }
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

      {/* Workflows Section */}
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Workflows</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            size="sm"
            onClick={() => {
              setEditingWorkflowId(null);
              workflowForm.reset();
              setWorkflowModalOpened(true);
            }}
          >
            New Workflow
          </Button>
        </Group>

        {isLoadingWorkflows ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : workflowsArray.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No workflows configured for this matter.
          </Text>
        ) : (
          <Stack gap="lg">
            {workflowsArray.map((workflow: Workflow, index) => (
              <Box key={workflow.id}>
                {index > 0 && <Divider mb="lg" />}
                <Group justify="space-between" mb="sm">
                  <Group gap="sm">
                    <Title order={4}>{workflow.name}</Title>
                    <Badge variant="light" size="sm">
                      {workflow.trigger.replace(/_/g, " ").replace(/:/g, " - ")}
                    </Badge>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      onClick={() => handleEditWorkflow(workflow)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() =>
                        handleDeleteWorkflow(workflow.id, workflow.name)
                      }
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Paper p="md" bg="gray.0" radius="sm">
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {workflow.instructions}
                  </Text>
                </Paper>
                <Text size="xs" c="dimmed" mt="xs">
                  Created: {new Date(workflow.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Add Team Member Modal */}
      <Modal
        opened={timekeeperModalOpened}
        onClose={() => {
          setTimekeeperModalOpened(false);
          setEditingTimekeeperRoleId(null);
          timekeeperForm.reset();
        }}
        title={editingTimekeeperRoleId ? "Edit Team Member" : "Add Team Member"}
      >
        <form onSubmit={timekeeperForm.onSubmit(handleTimekeeperSubmit)}>
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
              disabled={!!editingTimekeeperRoleId}
              {...timekeeperForm.getInputProps("timekeeperId")}
            />
            <Select
              label="Role"
              placeholder="Select a role"
              data={rolesArray.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
              required
              searchable
              {...timekeeperForm.getInputProps("roleId")}
            />
            <NumberInput
              label="Billable Rate (per hour)"
              placeholder="Enter hourly rate"
              prefix="£"
              min={0}
              decimalScale={2}
              required
              {...timekeeperForm.getInputProps("billableRate")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setTimekeeperModalOpened(false);
                  setEditingTimekeeperRoleId(null);
                  timekeeperForm.reset();
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
                {editingTimekeeperRoleId ? "Update" : "Add"} Team Member
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Workflow Modal */}
      <Modal
        opened={workflowModalOpened}
        onClose={() => {
          setWorkflowModalOpened(false);
          setEditingWorkflowId(null);
          workflowForm.reset();
        }}
        title={editingWorkflowId ? "Edit Workflow" : "Create New Workflow"}
        size="lg"
      >
        <form onSubmit={workflowForm.onSubmit(handleWorkflowSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="Time Entry Review Process"
              required
              {...workflowForm.getInputProps("name")}
            />
            <Textarea
              label="Instructions"
              placeholder="Natural language instructions for this workflow..."
              required
              minRows={15}
              {...workflowForm.getInputProps("instructions")}
            />
            <Select
              label="Trigger"
              placeholder="Select the event that triggers this workflow"
              required
              data={workflowTriggerSchema.options.map((option) => ({
                value: option,
                label: option.replace(/_/g, " ").replace(/:/g, " - "),
              }))}
              {...workflowForm.getInputProps("trigger")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setWorkflowModalOpened(false);
                  setEditingWorkflowId(null);
                  workflowForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createWorkflowMutation.isPending ||
                  updateWorkflowMutation.isPending
                }
              >
                {editingWorkflowId ? "Update" : "Create"} Workflow
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
