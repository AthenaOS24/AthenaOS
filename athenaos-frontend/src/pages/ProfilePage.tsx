// src/pages/ProfilePage.tsx
// Trigger redeploy

import { useEffect, useMemo } from "react"; 
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Progress,
  Stack,
  Table,
  Text,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import {
  IconUser,
  IconCalendar,
  IconMapPin,
  IconPhone,
  IconMail,
  IconChevronRight,
  IconMessage2,
} from "@tabler/icons-react";
import { useAuthStore } from "../context/authStore";
import { useChatStore } from "../context/chatStore";
import "./ProfilePage.css";

interface IUser {
  name?: string;
  username?: string;
  email?: string;
  description?: string;
  dob?: string;
  address?: string;
  phone?: string;
  avatarUrl?: string | null;
}

interface IConversation {
  id: string | number;
  updatedAt?: string | number | Date;
  createdAt?: string | number | Date;
  title?: string;
  messages?: unknown[];
  messageCount?: number;
}

interface AppAuthStore {
  isAuthenticated: boolean;
  token: string | null;
  getState: () => { user?: IUser };
}

interface AppChatStore {
  conversations?: IConversation[];
  setSelectedConversation: (id: string | number) => void;
  selectConversation?: (id: string | number) => void;
  fetchConversations: (token: string) => Promise<void>;
}

type Maybe<T> = T | null | undefined;

export function ProfilePage() {
  const navigate = useNavigate();

  // ------- Auth -------
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const storeState = (useAuthStore as unknown as AppAuthStore).getState?.() ?? {};
  const user: IUser = storeState.user ?? {};

  const name: string = user?.name || user?.username || "User";
  const email: string = user?.email || "—";
  const description: string = user?.description || "No description provided yet.";
  const dob: string = user?.dob || "—";
  const address: string = user?.address || "—";
  const phone: string = user?.phone || "—";
  const avatarUrl: Maybe<string> = user?.avatarUrl;

  // ------- Chats -------
  const chatState = useChatStore() as unknown as AppChatStore;

  const conversations: IConversation[] = useMemo(
    () => chatState?.conversations ?? [],
    [chatState?.conversations]
  );
  
  const setSelectedConversation = chatState?.setSelectedConversation ?? chatState?.selectConversation;
  const fetchConversations = chatState?.fetchConversations;

  useEffect(() => {
    if (
      token &&
      typeof fetchConversations === "function" &&
      (!Array.isArray(conversations) || conversations.length === 0)
    ) {
      fetchConversations(token).catch(() => {});
    }
  }, [token, conversations, fetchConversations]);

  const allChats = useMemo(() => {
    const list: IConversation[] = Array.isArray(conversations) ? [...conversations] : [];
    return list
      .sort((a: IConversation, b: IConversation) => {
        const ta = new Date(a?.updatedAt ?? a?.createdAt ?? 0).getTime();
        const tb = new Date(b?.updatedAt ?? b?.createdAt ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, 20);
  }, [conversations]);

  const totalChats = allChats.length;
  const recentChats = allChats.slice(0, 6);
  const msgCount = allChats.reduce((sum, c: IConversation) => {
    if (Array.isArray(c?.messages)) return sum + c.messages.length;
    if (typeof c?.messageCount === "number") return sum + c.messageCount;
    return sum;
  }, 0);

  const resume = (id: string | number) => {
    setSelectedConversation?.(id);
    navigate("/chat");
  };

  if (!isAuthenticated) {
    return (
      <Stack className="page-root">
        <Title order={2}>Profile</Title>
        <Text>You’re not logged in.</Text>
        <Button component={Link} to="/login">Go to Login</Button>
      </Stack>
    );
  }

  return (
    <div className="page-root">
      {/* Breadcrumb header (matches Dashboard style) */}
      <Group justify="space-between" align="center" className="dash-header">
        <Group gap="xs" className="dash-breadcrumb">
          <Title order={3} className="crumb-muted">Dashboard</Title>
          <IconChevronRight size={16} />
          <Title order={3}>Profile</Title>
        </Group>
        <Button variant="light" size="sm" className="btn-outline">Edit profile</Button>
      </Group>

      {/* KPI tiles — same visual language as DashboardPage */}
      <Grid gutter="md" mt="xs">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder radius="md" className="kpi-card">
            <Text size="sm" fw={600}>Total conversations</Text>
            <Group align="baseline" gap="6" mt="xs">
              <Text className="kpi-value">{totalChats}</Text>
            </Group>
            <Progress value={Math.min(totalChats * 5, 100)} color="blue" radius="xl" size="sm" mt="sm" />
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder radius="md" className="kpi-card">
            <Text size="sm" fw={600}>Messages (sum)</Text>
            <Group align="baseline" gap="6" mt="xs">
              <Text className="kpi-value">{msgCount}</Text>
            </Group>
            <Progress value={Math.min((msgCount / 50) * 100, 100)} color="teal" radius="xl" size="sm" mt="sm" />
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder radius="md" className="kpi-card">
            <Text size="sm" fw={600}>Recent active</Text>
            <Group align="baseline" gap="6" mt="xs">
              <Text className="kpi-value">{recentChats.length}</Text>
            </Group>
            <Progress value={Math.min((recentChats.length / 10) * 100, 100)} color="grape" radius="xl" size="sm" mt="sm" />
          </Card>
        </Grid.Col>
      </Grid>

      {/* Main content: left profile details, right chat history (cards match Dashboard) */}
      <Grid gutter="md" mt="md">
        {/* Left: profile details card */}
        <Grid.Col span={{ base: 12, md: 5, lg: 4 }}>
          <Card withBorder radius="md" p="lg" className="profile-card">
            <Group align="flex-start" wrap="nowrap">
              <Avatar src={avatarUrl || undefined} radius="xl" size={96}>
                {avatarUrl ? null : <IconUser size={48} />}
              </Avatar>

              <Stack gap={6} style={{ flex: 1 }}>
                <Group gap="xs" align="center">
                  <Text fw={700} fz="lg">{name}</Text>
                  {token ? <Badge color="teal" variant="light">Authenticated</Badge> : null}
                </Group>
                <Text c="dimmed" fz="sm">{description}</Text>
              </Stack>
            </Group>

            <Divider my="md" />

            <Stack gap="xs" className="details-list">
              <Detail icon={<IconMapPin size={18} />} label="Address" value={address} />
              <Detail icon={<IconMail size={18} />} label="Email" value={email} />
              <Detail icon={<IconPhone size={18} />} label="Phone" value={phone} />
              <Detail icon={<IconCalendar size={18} />} label="DOB" value={dob} />
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right: chat history table */}
        <Grid.Col span={{ base: 12, md: 7, lg: 8 }}>
          <Card withBorder radius="md" p="lg" className="profile-card">
            <Group justify="space-between" mb="xs">
              <Title order={3}>Chat history</Title>
              {totalChats > 6 ? <Text c="dimmed" size="sm">{totalChats} total</Text> : null}
            </Group>
            <Divider mb="sm" />

            {allChats.length === 0 ? (
              <Text c="dimmed">No conversations yet.</Text>
            ) : (
              <Table striped highlightOnHover withTableBorder className="chat-table">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Last activity</Table.Th>
                    <Table.Th>Messages</Table.Th>
                    <Table.Th className="th-right">Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {allChats.map((c: IConversation) => {
                    const id = c?.id;
                    const when = new Date(
                      c?.updatedAt ?? c?.createdAt ?? Date.now()
                    ).toLocaleString();
                    const title = c?.title || `Conversation #${String(id ?? "—")}`;
                    const count = Array.isArray(c?.messages)
                      ? c.messages.length
                      : c?.messageCount ?? "—";
                    return (
                      <Table.Tr key={String(id ?? Math.random())}>
                        <Table.Td>
                          <Group gap="xs">
                            <ThemeIcon variant="light" size={26} radius="md">
                              <IconMessage2 size={16} />
                            </ThemeIcon>
                            <Text fw={600}>{title}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text c="dimmed" size="sm">{when}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{count}</Badge>
                        </Table.Td>
                        <Table.Td className="td-right">
                          <Button
                            size="xs"
                            onClick={() => id != null && resume(id)}
                            disabled={id == null}
                          >
                            Resume
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Footer meta to mirror Dashboard footer spacing */}
      <Group justify="space-between" mt="lg" className="foot-row">
        <Text size="sm" c="dimmed">
          Profile data is synced to your account
        </Text>
      </Group>
    </div>
  );
}

/** small presentational row */
function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon variant="light" size={28} radius="md">
        {icon}
      </ThemeIcon>
      <div>
        <Text className="field-label">{label}</Text>
        <Text fw={600}>{value}</Text>
      </div>
    </Group>
  );
}

export default ProfilePage;
