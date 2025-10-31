import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from './chatStore';

export interface Chat {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  workspacePath?: string;
}

interface ChatsStore {
  chats: Chat[];
  currentChatId: string | null;
  currentWorkspacePath: string | null;

  setWorkspace: (workspacePath: string | null) => void;
  getWorkspaceChats: () => Chat[];
  createChat: (name?: string) => string;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newName: string) => void;
  switchChat: (chatId: string) => void;
  getCurrentChat: () => Chat | null;

  addMessageToCurrentChat: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessageInCurrentChat: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessageFromCurrentChat: (messageId: string) => void;
  clearCurrentChat: () => void;
}

export const useChatsStore = create<ChatsStore>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      currentWorkspacePath: null,

      setWorkspace: (workspacePath) => {
        const state = get();
        let newCurrentChatId = null;

        if (workspacePath) {
          const workspaceChats = state.chats.filter((chat) => chat.workspacePath === workspacePath);
          if (workspaceChats.length > 0) {
            newCurrentChatId = workspaceChats[0].id;
          }
        }

        set({
          currentWorkspacePath: workspacePath,
          currentChatId: newCurrentChatId,
        });
      },

      getWorkspaceChats: () => {
        const state = get();
        if (!state.currentWorkspacePath) {
          return state.chats.filter((chat) => !chat.workspacePath);
        }
        return state.chats.filter((chat) => chat.workspacePath === state.currentWorkspacePath);
      },

      createChat: (name?: string) => {
        const state = get();
        const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const workspaceChats = state.getWorkspaceChats();
        const chatName = name || `Chat ${workspaceChats.length + 1}`;

        const newChat: Chat = {
          id: chatId,
          name: chatName,
          messages: [],
          createdAt: now,
          updatedAt: now,
          workspacePath: state.currentWorkspacePath || undefined,
        };

        set((state) => ({
          chats: [...state.chats, newChat],
          currentChatId: chatId,
        }));

        return chatId;
      },

      deleteChat: (chatId) => {
        set((state) => {
          const newChats = state.chats.filter((chat) => chat.id !== chatId);

          let newCurrentChatId = state.currentChatId;
          if (state.currentChatId === chatId) {
            const workspaceChats = newChats.filter(
              (chat) =>
                chat.workspacePath === state.currentWorkspacePath ||
                (!chat.workspacePath && !state.currentWorkspacePath)
            );

            if (workspaceChats.length > 0) {
              newCurrentChatId = workspaceChats[workspaceChats.length - 1].id;
            } else {
              newCurrentChatId = null;
            }
          }

          return {
            chats: newChats,
            currentChatId: newCurrentChatId,
          };
        });
      },

      renameChat: (chatId, newName) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, name: newName, updatedAt: new Date() } : chat
          ),
        }));
      },

      switchChat: (chatId) => {
        set({ currentChatId: chatId });
      },

      getCurrentChat: () => {
        const state = get();
        if (!state.currentChatId) return null;
        return state.chats.find((chat) => chat.id === state.currentChatId) || null;
      },

      addMessageToCurrentChat: (message) => {
        const currentChatId = get().currentChatId;
        if (!currentChatId) return;

        const newMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      updateMessageInCurrentChat: (messageId, updates) => {
        const currentChatId = get().currentChatId;
        if (!currentChatId) return;

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      removeMessageFromCurrentChat: (messageId) => {
        const currentChatId = get().currentChatId;
        if (!currentChatId) return;

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.filter((msg) => msg.id !== messageId),
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      clearCurrentChat: () => {
        const currentChatId = get().currentChatId;
        if (!currentChatId) return;

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [],
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },
    }),
    {
      name: 'chats-storage',

      partialize: (state) => ({
        chats: state.chats.map((chat) => ({
          ...chat,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
          messages: chat.messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        })),
        currentChatId: state.currentChatId,
        currentWorkspacePath: state.currentWorkspacePath,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.chats = state.chats.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
        }
      },
    }
  )
);
