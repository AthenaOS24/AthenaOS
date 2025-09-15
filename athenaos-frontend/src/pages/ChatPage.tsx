// src/pages/ChatPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Paper, TextInput, Button, Stack, Group, Text, ScrollArea, Avatar, Title, Center,
  Drawer, NavLink, Divider, Box, Alert,
} from '@mantine/core';
import { IconMessage2, IconPlus } from '@tabler/icons-react';
import axios from 'axios';
import { useAuthStore } from '../context/authStore';
import { useChatStore } from '../context/chatStore';

type ID = string | number;

// Build the base URL once; you can set VITE_API_URL in your .env
const API_BASE = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:8888';

const sendMessage = async (text: string, token: string) => {
  const res = await axios.post(
    `${API_BASE}/api/chat/send-message`,
    { text },
    { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
  );
  return res.data; // assume { id?, ... } or similar
};

export function ChatPage() {
  const token = useAuthStore((s) => s.token);

  // Chat store (defensive typing)
  const chat = useChatStore() as any;
  const fetchConversations: (t?: string) => Promise<void> =
    chat?.fetchConversations ?? (async () => {});
  const selectedConversation: any = chat?.selectedConversation ?? null;
  const conversations: any[] = Array.isArray(chat?.conversations) ? chat.conversations : [];
  const setSelectedConversation:
    | ((id: ID | null) => void)
    | undefined = chat?.setSelectedConversation ?? chat?.selectConversation;
  const createConversation:
    | ((t?: string) => Promise<any> | any)
    | undefined = chat?.createConversation ?? chat?.startNewConversation;

  // UI state
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bottom sentinel for smooth autoscroll
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Initial load (and when token changes)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setError(null);
        await fetchConversations(token);
      } catch (e: any) {
        console.error('Failed to fetch conversations:', e);
        setError(humanizeAxiosError(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sort messages safely
  const msgs = useMemo(
    () =>
      selectedConversation?.messages ?? selectedConversation?.Messages
        ? [...selectedConversation.Messages].sort(
            (a: any, b: any) =>
              new Date(a?.createdAt ?? 0).getTime() - new Date(b?.createdAt ?? 0).getTime()
          )
        : [],
    [selectedConversation]
  );

  // Auto scroll when conversation or count changes
  useEffect(() => { scrollToBottom(); }, [selectedConversation]);
  useEffect(() => { scrollToBottom(); }, [msgs.length]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Not authenticated. Please login again.');
      return;
    }
    const text = newMessage.trim();
    if (!text || loading) return;

    setError(null);
    setNewMessage('');
    setLoading(true);
    try {
      await sendMessage(text, token);
      await fetchConversations(token);

      // Ensure the newest conversation is selected if store doesn't auto-select
      const latest = getNewestConversation(conversations);
      if (latest && selectedConversation?.id !== latest.id) {
        setSelectedConversation?.(latest.id as any);
      }
    } catch (e: any) {
      console.error('Failed to send message:', e);
      setError(humanizeAxiosError(e));
    } finally {
      setLoading(false);
      // Scroll after UI settles
      setTimeout(scrollToBottom, 100);
    }
  };

  // New chat
  const handleNewConversation = async () => {
    if (!token) {
      setError('Not authenticated. Please login again.');
      return;
    }
    setError(null);
    try {
      let result: any = undefined;
      if (typeof createConversation === 'function') {
        result = createConversation.length >= 1
          ? await createConversation(token)
          : await createConversation();
      }
      const newId = result?.id ?? (typeof result === 'string' || typeof result === 'number' ? result : null);

      await fetchConversations(token);

      // Prefer explicit newId; otherwise pick the newest convo
      const idToSelect = newId ?? getNewestConversation(conversations)?.id ?? null;
      if (idToSelect != null) setSelectedConversation?.(idToSelect as any);
    } catch (e: any) {
      console.error('Failed to create conversation:', e);
      setError(humanizeAxiosError(e));
    } finally {
      setDrawerOpen(false);
    }
  };

  // Drawer list
  const convs = useMemo(() => {
    return conversations
      .map((c: any) => {
        const ts = new Date(c?.updatedAt ?? c?.createdAt ?? Date.now());
        return {
          id: c?.id,
          label: c?.title || `Chat on ${ts.toLocaleDateString()}`,
          updatedAt: ts.getTime(),
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations]);

  const handleSelectConversation = (id: ID | null) => {
    setSelectedConversation?.(id as any);
    setDrawerOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 100px)' }}>
      <Title order={3} mb="xs">AthenaAI Chat</Title>

      {!!error && (
        <Alert color="red" mb="sm" title="Chat error">
          {error}
        </Alert>
      )}

      {/* Top controls */}
      <Group mb="sm" justify="space-between">
        <Button
          variant="light"
          leftSection={<IconMessage2 size={16} />}
          onClick={() => setDrawerOpen(true)}
        >
          Conversations
        </Button>
        <Button leftSection={<IconPlus size={16} />} onClick={handleNewConversation}>
          New Chat
        </Button>
      </Group>

      {/* Messages */}
      <ScrollArea style={{ flex: 1 }}>
        <Stack p="md" gap="lg">
          {selectedConversation ? (
            msgs.length > 0 ? (
              msgs.map((m: any) => (
                <Group key={m.id} justify={m.sender === 'user' ? 'flex-end' : 'flex-start'}>
                  {m.sender === 'bot' && <Avatar color="blue" radius="xl">AI</Avatar>}
                  <Paper
                    shadow="sm" p="sm" radius="lg" withBorder
                    style={{
                      backgroundColor: m.sender === 'user' ? '#228be6' : '#f1f3f5',
                      color: m.sender === 'user' ? 'white' : 'black',
                      maxWidth: '70%',
                    }}
                  >
                    <Text>{m.text}</Text>
                  </Paper>
                  {m.sender === 'user' && <Avatar color="cyan" radius="xl">ME</Avatar>}
                </Group>
              ))
            ) : (
              <Center style={{ minHeight: 300 }}>
                <Title order={4}>Start a new conversation by typing a message!</Title>
              </Center>
            )
          ) : (
            <Center style={{ minHeight: 300 }}>
              <Title order={4}>Open “Conversations” or click “New Chat” to begin</Title>
            </Center>
          )}
          <div ref={bottomRef} />
        </Stack>
      </ScrollArea>

      {/* Composer */}
      <Paper component="form" onSubmit={handleSend} withBorder p="sm" radius="md" mt="md">
        <Group>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
            disabled={loading}
          />
          <Button type="submit" loading={loading}>Send</Button>
          <Button type="submit" loading={loading}>Voice</Button>
        </Group>
      </Paper>

      

      {/* RIGHT drawer — never covers the left site navbar */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Conversations"
        position="right"
        size={320}
        zIndex={1500}
        overlayProps={{ opacity: 0.15 }}
      >
        <Stack>
          <Button fullWidth leftSection={<IconPlus size={16} />} onClick={handleNewConversation}>
            New Chat
          </Button>
          <Divider />
          <Box>
            {convs.length === 0 ? (
              <Text c="dimmed">No conversations yet.</Text>
            ) : (
              convs.map((c) => (
                <NavLink
                  key={String(c.id)}
                  label={c.label}
                  leftSection={<IconMessage2 size={16} />}
                  active={selectedConversation?.id === c.id}
                  onClick={() => handleSelectConversation(c.id as any)}
                  style={{ borderRadius: 8 }}
                />
              ))
            )}
          </Box>
        </Stack>
      </Drawer>
    </div>
  );
}

function getNewestConversation(conversations: any[]) {
  if (!Array.isArray(conversations) || conversations.length === 0) return null;
  const arr = conversations
    .map((c) => ({ c, t: new Date(c?.updatedAt ?? c?.createdAt ?? 0).getTime() }))
    .sort((a, b) => b.t - a.t);
  return arr[0]?.c ?? null;
}

function humanizeAxiosError(e: any): string {
  if (e?.response) {
    const code = e.response.status;
    const msg = e.response.data?.message || e.response.statusText || 'Request failed';
    if (code === 401) return 'Not authorized (401). Please login again.';
    if (code === 404) return 'Endpoint not found (404). Check API URL.';
    return `${msg} (HTTP ${code})`;
  }
  if (e?.request) return 'No response from server. Is the backend running?';
  return e?.message || 'Unexpected error';
}

export default ChatPage;
