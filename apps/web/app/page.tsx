"use client";

import { AppShell } from "../components/AppShell";
import {
  Title,
  Text,
  Container,
  Paper,
  SimpleGrid,
  Group,
} from "@mantine/core";
import {
  IconBriefcase,
  IconFileInvoice,
  IconClock,
  IconSparkles,
} from "@tabler/icons-react";

export default function HomePage() {
  return (
    <AppShell>
      <Container size="xl">
        <Title order={1} mb="xl">
          Dashboard
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Group>
              <IconBriefcase size={32} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed">
                  Active Matters
                </Text>
                <Text size="xl" fw={700}>
                  -
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Group>
              <IconFileInvoice size={32} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed">
                  Draft Bills
                </Text>
                <Text size="xl" fw={700}>
                  -
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Group>
              <IconClock size={32} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed">
                  Time Entries
                </Text>
                <Text size="xl" fw={700}>
                  -
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper shadow="sm" p="md" radius="md" withBorder>
            <Group>
              <IconSparkles size={32} stroke={1.5} />
              <div>
                <Text size="xs" c="dimmed">
                  Pending Suggestions
                </Text>
                <Text size="xl" fw={700}>
                  -
                </Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        <Text mt="xl" c="dimmed">
          Select a matter from the switcher above to get started.
        </Text>
      </Container>
    </AppShell>
  );
}
