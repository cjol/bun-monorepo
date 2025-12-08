"use client";

import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Title,
  UnstyledButton,
  Menu,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBriefcase,
  IconClock,
  IconUsers,
  IconChevronDown,
  IconSettings,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { MatterSwitcher } from "./MatterSwitcher";

interface AppShellProps {
  children: ReactNode;
  matterId?: string;
}

const topLevelNavItems = [
  { icon: IconBriefcase, label: "Matters", href: "/matters" },
  { icon: IconUsers, label: "Timekeepers", href: "/timekeepers" },
];

function getMatterNavigationItems(matterId: string) {
  const base = `/matters/${matterId}`;
  return [
    { icon: IconClock, label: "Time Entries", href: `${base}/time-entries` },
    { icon: IconSettings, label: "Settings", href: `${base}/settings` },
  ];
}

export function AppShell({ children, matterId }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const matterNavItems = matterId ? getMatterNavigationItems(matterId) : [];
  const showSidebar = !!matterId;

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={
        showSidebar
          ? { width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }
          : undefined
      }
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {showSidebar && (
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
            )}
            <UnstyledButton onClick={() => router.push("/matters")}>
              <Title order={3}>FixMyTime Admin</Title>
            </UnstyledButton>
            <Group gap="xs" ml="xl" visibleFrom="sm">
              {topLevelNavItems.map((item) => (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  variant={pathname.startsWith(item.href) ? "light" : "subtle"}
                  leftSection={<item.icon size={18} stroke={1.5} />}
                  size="sm"
                >
                  {item.label}
                </Button>
              ))}
            </Group>
          </Group>
          <Group>
            <Menu shadow="md" width={200} trigger="hover" openDelay={100}>
              <Menu.Target>
                <Button
                  variant="subtle"
                  rightSection={<IconChevronDown size={16} />}
                  hiddenFrom="sm"
                >
                  Menu
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {topLevelNavItems.map((item) => (
                  <Menu.Item
                    key={item.href}
                    component={Link}
                    href={item.href}
                    leftSection={<item.icon size={16} stroke={1.5} />}
                  >
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <MatterSwitcher />
          </Group>
        </Group>
      </MantineAppShell.Header>

      {showSidebar && (
        <MantineAppShell.Navbar p="md">
          <MantineAppShell.Section grow component={ScrollArea}>
            {matterNavItems.map((item) => (
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
      )}

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
