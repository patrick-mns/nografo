import { useChatsStore } from '@/store/chatsStore';

export const useChatMessages = () => {
  const {
    getCurrentChat,
    addMessageToCurrentChat,
    updateMessageInCurrentChat,
    removeMessageFromCurrentChat,
  } = useChatsStore();

  const currentChat = getCurrentChat();
  const messages = currentChat?.messages || [];

  const addMessage = (message: any) => addMessageToCurrentChat(message);
  const updateMessage = (id: string, updates: any) => updateMessageInCurrentChat(id, updates);
  const removeMessage = (id: string) => removeMessageFromCurrentChat(id);

  const addUserMessage = (content: string) => {
    addMessage({
      type: 'user',
      content,
    });
  };

  const addAssistantMessage = (content: string) => {
    addMessage({
      type: 'assistant',
      content,
    });
  };

  return {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    addUserMessage,
    addAssistantMessage,
  };
};
