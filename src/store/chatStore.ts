import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RAGContext } from '@/services/ragService';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ragContext?: RAGContext | null;
  codeActions?: {
    filepath: string;
    code: string;
    language: string;
    description?: string;
    status: 'pending' | 'accepted' | 'rejected';
    isEdit?: boolean;
    onAccept?: () => void;
    onReject?: () => void;
  }[];
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  removeMessage: (id: string) => void;
  updateCodeActionStatus: (
    messageId: string,
    filepath: string,
    status: 'accepted' | 'rejected'
  ) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],

      addMessage: (message) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
            },
          ],
        }));
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
        }));
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      removeMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }));
      },

      updateCodeActionStatus: (messageId, filepath, status) => {
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id === messageId && msg.codeActions) {
              return {
                ...msg,
                codeActions: msg.codeActions.map((action) =>
                  action.filepath === filepath ? { ...action, status } : action
                ),
              };
            }
            return msg;
          }),
        }));
      },
    }),
    {
      name: 'chat-history-storage',

      partialize: (state) => ({
        messages: state.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.messages = state.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
      },
    }
  )
);
