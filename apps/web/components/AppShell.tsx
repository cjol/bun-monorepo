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
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { MatterSwitcher } from "./MatterSwitcher";

interface AppShellProps {
  children: ReactNode;
  matterId?: string;
}

function getNavigationItems(matterId?: string) {
  const topLevelItems = [
    { icon: IconHome, label: "Dashboard", href: "/" },
    { icon: IconBriefcase, label: "Matters", href: "/matters" },
    { icon: IconUsers, label: "Timekeepers", href: "/timekeepers" },
  ];

  if (!matterId) {
    return topLevelItems;
  }

  const base = `/matters/${matterId}`;
  return [
    { icon: IconHome, label: "Dashboard", href: base },
    { icon: IconFileInvoice, label: "Bills", href: `${base}/bills` },
    { icon: IconClock, label: "Time Entries", href: `${base}/time-entries` },
    {
      icon: IconSparkles,
      label: "AI Suggestions",
      href: `${base}/suggestions`,
    },
    { icon: IconNote, label: "Workflows", href: `${base}/workflows` },
    ...topLevelItems.slice(1), // Add Matters and Timekeepers at the end
  ];
}

export function AppShell({ children, matterId }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const navigationItems = getNavigationItems(matterId);

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
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} stroke={1.5} />}
              active={pathname === item.href}
            />
          ))}
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
