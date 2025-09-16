// src/context/chatStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../services/apiService'; 

export interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  userId: number;
  messages: Message[];
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
      // ĐÃ SỬA: Bỏ localhost và dùng API_URL
      const response = await axios.get(`${API_URL}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rawConversations = Array.isArray(response.data) ? response.data : [] as any[];
      const newConversations: Conversation[] = rawConversations.map((c: any) => ({
        ...c,
        messages: Array.isArray(c.messages) ? c.messages : (Array.isArray(c.Messages) ? c.Messages : []),
        Messages: Array.isArray(c.Messages) ? c.Messages : (Array.isArray(c.messages) ? c.messages : []),
      }));
      const currentSelectedId = get().selectedConversation?.id;

      set({ conversations: newConversations });

      let conversationToSelect: Conversation | null = null;
      if (currentSelectedId) {
        conversationToSelect = newConversations.find(c => c.id === currentSelectedId) || null;
      } else if (newConversations.length > 0) {
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