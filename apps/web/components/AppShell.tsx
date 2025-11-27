"use client";

import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBriefcase,
  IconFileInvoice,
  IconClock,
  IconSparkles,
  IconUsers,
  IconNote,
  IconHome,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { MatterSwitcher } from "./MatterSwitcher";

interface AppShellProps {
  children: ReactNode;
}

const navigationItems = [
  { icon: IconHome, label: "Dashboard", href: "/" },
  { icon: IconBriefcase, label: "Matters", href: "/matters" },
  { icon: IconFileInvoice, label: "Bills", href: "/bills" },
  { icon: IconClock, label: "Time Entries", href: "/time-entries" },
  { icon: IconSparkles, label: "AI Suggestions", href: "/suggestions" },
  { icon: IconUsers, label: "Timekeepers", href: "/timekeepers" },
  { icon: IconNote, label: "Workflows", href: "/workflows" },
];

export function AppShell({ children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <UnstyledButton onClick={() => router.push("/")}>
              <Title order={3}>FixMyTime Admin</Title>
            </UnstyledButton>
          </Group>
          <MatterSwitcher />
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <MantineAppShell.Section grow component={ScrollArea}>
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} stroke={1.5} />}
              active={pathname === item.href}
              onClick={() => {
                router.push(item.href);
                if (opened) toggle();
              }}
            />
          ))}
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
