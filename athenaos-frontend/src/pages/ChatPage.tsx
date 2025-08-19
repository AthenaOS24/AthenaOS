// src/pages/ChatPage.tsx
import { useEffect, useState, useRef } from 'react';
import { Paper, TextInput, Button, Stack, Group, Text, ScrollArea, Avatar, Title, Center } from '@mantine/core';
import { useAuthStore } from '../context/authStore';
import { useChatStore } from '../context/chatStore';
import axios from 'axios';

export type { Message, Conversation } from '../context/chatStore';

const sendMessage = async (text: string, token: string) => {
  const response = await axios.post(
    'http://localhost:8888/api/chat/send',
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export function ChatPage() {
  const token = useAuthStore((state) => state.token);
  const { selectedConversation, fetchConversations } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);


  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !token) return;

    const userMessageText = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      // Gửi tin nhắn và nhận phản hồi từ backend
      await sendMessage(userMessageText, token);
      
      // FIX: Sau khi gửi tin nhắn thành công, gọi fetchConversations để cập nhật lại danh sách.
      // Logic trong store sẽ tự động chọn cuộc trò chuyện mới nhất.
      await fetchConversations(token);

    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const sortedMessages = selectedConversation?.Messages.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
            <Stack p="md" gap="lg">
            {selectedConversation ? (
                sortedMessages.length > 0 ? (
                    sortedMessages.map((message) => (
                        <Group key={message.id} justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}>
                            {message.sender === 'bot' && <Avatar color="blue" radius="xl">BOT</Avatar>}
                            <Paper shadow="sm" p="sm" radius="lg" withBorder style={{ backgroundColor: message.sender === 'user' ? '#228be6' : '#f1f3f5', color: message.sender === 'user' ? 'white' : 'black', maxWidth: '70%' }}>
                                <Text>{message.text}</Text>
                            </Paper>
                            {message.sender === 'user' && <Avatar color="cyan" radius="xl">ME</Avatar>}
                        </Group>
                    ))
                ) : (
                    <Center style={{height: '100%', textAlign: 'center', minHeight: '400px'}}>
                        <Title order={3}>Start a new conversation by typing a message!</Title>
                    </Center>
                )
            ) : (
                <Center style={{height: '100%', textAlign: 'center', minHeight: '400px'}}>
                    <Title order={3}>Select a conversation or start a new one!</Title>
                </Center>
            )}
            </Stack>
        </ScrollArea>

        <Paper component="form" onSubmit={handleSendMessage} withBorder p="sm" radius="md" mt="md">
            <Group>
                <TextInput style={{ flex: 1 }} placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.currentTarget.value)} disabled={loading} />
                <Button type="submit" loading={loading}>Send</Button>
            </Group>
        </Paper>
    </div>
  );
}