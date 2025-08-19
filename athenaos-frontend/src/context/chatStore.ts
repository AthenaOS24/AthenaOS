// src/context/chatStore.ts
import { create } from 'zustand';
import axios from 'axios';

export interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  userId: number;
  Messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  fetchConversations: (token: string) => Promise<void>;
  selectConversation: (conversationId: number | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedConversation: null,

  fetchConversations: async (token) => {
    try {
      const response = await axios.get('http://localhost:8888/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newConversations: Conversation[] = response.data;
      const currentSelectedId = get().selectedConversation?.id;

      set({ conversations: newConversations });

      let conversationToSelect: Conversation | null = null;
      if (currentSelectedId) {
        // Nếu đã có cuộc trò chuyện được chọn, hãy tìm và cập nhật nó
        conversationToSelect = newConversations.find(c => c.id === currentSelectedId) || null;
      } else if (newConversations.length > 0) {
        // FIX: Nếu không có cuộc trò chuyện nào được chọn (trường hợp New Chat hoặc lần tải đầu tiên),
        // tìm cuộc trò chuyện mới nhất để tự động chọn.
        const sortedConversations = [...newConversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        conversationToSelect = sortedConversations[0];
      }

      set({ selectedConversation: conversationToSelect });

    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      set({ conversations: [], selectedConversation: null });
    }
  },

  selectConversation: (conversationId) =>
    set((state) => {
      if (conversationId === null) {
        return { selectedConversation: null };
      }
      const found = state.conversations.find((c) => c.id === conversationId);
      return { selectedConversation: found || null };
    }),
}));