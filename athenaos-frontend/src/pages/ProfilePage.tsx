// src/pages/ProfilePage.tsx
import { useEffect, useMemo } from 'react';
import {
  Avatar, Badge, Button, Card, Divider, Group, Stack, Text, ThemeIcon, Title,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconUser, IconCalendar, IconMapPin, IconPhone, IconMail, IconMessage2,
} from '@tabler/icons-react';
import { useAuthStore } from '../context/authStore';
import { useChatStore } from '../context/chatStore';

type Maybe<T> = T | null | undefined;

export function ProfilePage() {
  const navigate = useNavigate();

  // Auth
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const storeState: any = (useAuthStore as any)?.getState?.() ?? {};
  const user: any = storeState.user ?? {};

  const name: string = user?.name || user?.username || 'User';
  const email: string = user?.email || '—';
  const description: string = user?.description || 'No description provided yet.';
  const dob: string = user?.dob || '—';
  const address: string = user?.address || '—';
  const phone: string = user?.phone || '—';
  const avatarUrl: Maybe<string> = user?.avatarUrl;

  // Chats (defensive)
  const chatState = useChatStore() as any;
  const conversations: any[] = chatState?.conversations ?? [];
  const setSelectedConversation:
    | ((id: string | number | null) => void)
    | undefined = chatState?.setSelectedConversation ?? chatState?.selectConversation;
  const fetchConversations:
    | ((t?: string) => Promise<void>)
    | undefined = chatState?.fetchConversations;

  useEffect(() => {
    if (token && typeof fetchConversations === 'function' && (!Array.isArray(conversations) || conversations.length === 0)) {
      fetchConversations(token).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const recent = useMemo(() => {
    const list = Array.isArray(conversations) ? [...conversations] : [];
    return list
      .sort((a: any, b: any) => {
        const ta = new Date(a?.updatedAt ?? a?.createdAt ?? 0).getTime();
        const tb = new Date(b?.updatedAt ?? b?.createdAt ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, 6);
  }, [conversations]);

  const resume = (id: string | number) => {
    setSelectedConversation?.(id as any);
    navigate('/chat');
  };

  if (!isAuthenticated) {
    return (
      <Stack>
        <Title order={2}>Profile</Title>
        <Text>You’re not logged in.</Text>
        <Button component={Link} to="/login">Go to Login</Button>
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={2}>Profile</Title>

      {/* Top: avatar + details */}
      <Card withBorder radius="md" p="lg">
        <Group align="flex-start" wrap="nowrap">
          <Avatar src={avatarUrl || undefined} radius="xl" size={96}>
            {avatarUrl ? null : <IconUser size={48} />}
          </Avatar>

          <Stack gap={6} style={{ flex: 1 }}>
            <Text fw={700} fz="lg">{name}</Text>
            <Text c="dimmed" fz="sm">{description}</Text>

            <Group gap="xs">
              <ThemeIcon variant="light"><IconCalendar size={18} /></ThemeIcon>
              <Text fw={600}>DOB:</Text><Text c="dimmed">{dob}</Text>
            </Group>
            <Group gap="xs">
              <ThemeIcon variant="light"><IconMapPin size={18} /></ThemeIcon>
              <Text fw={600}>Address:</Text><Text c="dimmed">{address}</Text>
            </Group>
            <Group gap="xs">
              <ThemeIcon variant="light"><IconPhone size={18} /></ThemeIcon>
              <Text fw={600}>Contact:</Text><Text c="dimmed">{phone}</Text>
            </Group>
            <Group gap="xs">
              <ThemeIcon variant="light"><IconMail size={18} /></ThemeIcon>
              <Text fw={600}>Email:</Text><Text c="dimmed">{email}</Text>
            </Group>

            {token ? <Badge color="teal" variant="light" mt={6}>Authenticated</Badge> : null}
          </Stack>
        </Group>
      </Card>

      {/* Past chats */}
      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="sm">
          <Title order={3}>Past chats</Title>
        </Group>
        <Divider mb="sm" />

        {recent.length === 0 ? (
          <Text c="dimmed">No conversations yet.</Text>
        ) : (
          <Stack>
            {recent.map((c: any) => {
              const id = c?.id as string | number | undefined;
              const when = new Date(c?.updatedAt ?? c?.createdAt ?? Date.now()).toLocaleString();
              return (
                <Group key={String(id ?? Math.random())} justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon variant="light"><IconMessage2 size={16} /></ThemeIcon>
                    <div>
                      <Text fw={600}>{c?.title ? c.title : `Conversation #${String(id ?? '—')}`}</Text>
                      <Text c="dimmed" fz="sm">{when}</Text>
                    </div>
                  </Group>
                  <Button size="xs" onClick={() => id != null && resume(id)} disabled={id == null}>
                    Resume
                  </Button>
                </Group>
              );
            })}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

export default ProfilePage;
