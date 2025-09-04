// src/components/MainLayout.tsx
import { useMemo, useState } from 'react';
import {
  AppShell, Burger, Group, Title, ScrollArea, NavLink, Button, Divider, Box,
} from '@mantine/core';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  IconHome2, IconUsersGroup, IconNotes, IconBriefcase, IconPhone,
  IconLogin, IconMessages, IconLogout, IconUser,
} from '@tabler/icons-react';
import { useAuthStore } from '../context/authStore';

type LinkItem = { label: string; to: string; icon: React.ReactNode };

export function MainLayout() {
  // Hidden by default; burger toggles it on BOTH desktop and mobile
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const publicLinks: LinkItem[] = useMemo(
    () => [
      { label: 'Home', to: '/', icon: <IconHome2 /> },
      { label: 'Team', to: '/team', icon: <IconUsersGroup /> },
      { label: 'Blog', to: '/blog', icon: <IconNotes /> },
      { label: 'Services', to: '/services', icon: <IconBriefcase /> },
      { label: 'Contact', to: '/contact', icon: <IconPhone /> },
    ],
    []
  );

  const authLinks: LinkItem[] = useMemo(
    () =>
      isAuthenticated
        ? [
            { label: 'Chat', to: '/chat', icon: <IconMessages /> },
            { label: 'Profile', to: '/profile', icon: <IconUser /> },
            { label: 'Dashboard', to: '/dashboard', icon: <IconUser /> },
          ]
        : [{ label: 'Login', to: '/login', icon: <IconLogin /> }],
    [isAuthenticated]
  );

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpened(false);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        // Slide-in behavior on ALL viewports, hidden by default
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding="md"
    >
      {/* Sticky header; high z-index so clicks always work */}
      <AppShell.Header style={{ position: 'sticky', zIndex: 2000 }}>
        <Group h="100%" px="md" justify="space-between" style={{ width: '100%' }}>
          {/* Burger always visible (desktop + mobile) */}
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            aria-label="Toggle sidebar"
          />

          {/* Clickable brand -> Home; also closes nav */}
          <Box style={{ flex: 1, textAlign: 'center' }}>
            <Link
              to="/"
              onClick={() => setOpened(false)}
              style={{ textDecoration: 'none', color: 'inherit' }}
              aria-label="Go to Home"
            >
              <Title order={1} size="2.4rem" fw={700}>AthenaAI</Title>
            </Link>
          </Box>

          {isAuthenticated && (
            <Button
              leftSection={<IconLogout size={16} />}
              variant="subtle"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </Group>
      </AppShell.Header>

      {/* LEFT NAVBAR — links only; clicking any link closes it */}
      <AppShell.Navbar p="sm" onClick={() => setOpened(false)}>
        <ScrollArea style={{ height: '100%' }} type="never">
          <Box mb="sm">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                label={l.label}
                leftSection={l.icon}
                component={Link}
                to={l.to}
                active={isActive(l.to)}
                style={{ borderRadius: 8 }}
              />
            ))}
          </Box>

          <Divider my="xs" />

          <Box mt="xs">
            {authLinks.map((l) => (
              <NavLink
                key={l.to}
                label={l.label}
                leftSection={l.icon}
                component={Link}
                to={l.to}
                active={isActive(l.to)}
                style={{ borderRadius: 8 }}
              />
            ))}
          </Box>

          {isAuthenticated && (
            <Box mt="md">
              <Button
                fullWidth
                variant="light"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          )}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default MainLayout;
