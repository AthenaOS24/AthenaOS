// src/components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { AppShell, Burger, Group, Button, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useChatStore } from '../context/chatStore';

// Main layout for the authenticated part of the app (the chat)
function ChatLayout() {
  const [opened, { toggle }] = useDisclosure();
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);

  // Get state and actions from the chat store
  const { conversations, selectedConversation, fetchConversations, selectConversation } = useChatStore();

  // This hook runs once to fetch the initial chat history
  useEffect(() => {
    if (token) {
      fetchConversations(token);
    }
  }, [token, fetchConversations]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>AthenaOS Chat</Title>
          </Group>
          <Button variant="light" onClick={logout}>
            Logout
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Button mb="md" onClick={() => selectConversation(null)}>
          + New Chat
        </Button>
        {/* List all fetched conversations */}
        {conversations.map((convo) => (
          <NavLink
            key={convo.id}
            label={`Chat on ${new Date(convo.createdAt).toLocaleDateString()}`}
            onClick={() => selectConversation(convo.id)}
            active={selectedConversation?.id === convo.id}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        {/* The ChatPage component will be rendered here */}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

// The "gatekeeper" component
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the main chat layout
  return <ChatLayout />;
}