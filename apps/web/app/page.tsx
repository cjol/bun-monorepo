"use client";

import { AppShell } from "../components/AppShell";
import { Title, Text, Container, Card, Group, Loader } from "@mantine/core";
import { IconBriefcase } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function HomePage() {
  const router = useRouter();

  const { data: matters, isLoading } = useQuery({
    queryKey: ["matters"],
    queryFn: async () => {
      const response = await api.matters.get();
      if (response.error) throw new Error("Failed to fetch matters");
      return response.data;
    },
  });

  return (
    <AppShell>
      <Container size="xl">
        <Title order={1} mb="xl">
          Select a Matter
        </Title>

        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : !matters || matters.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No matters found. Create one from the Matters page.
          </Text>
        ) : (
          matters.map((matter) => (
            <Card
              key={matter.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              mb="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/matters/${matter.id}`)}
            >
              <Group>
                <IconBriefcase size={32} stroke={1.5} />
                <div>
                  <Text fw={500}>{matter.clientName}</Text>
                  <Text size="sm" c="dimmed">
                    {matter.matterName}
                  </Text>
                </div>
              </Group>
            </Card>
          ))
        )}
      </Container>
    </AppShell>
  );
}
