import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useChatsStore } from '@/store/chatsStore';
import { useUIStore } from '@/store/uiStore';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useGraphStore } from '@/store/graphStore';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { WorkspaceRequired } from '../workspace/WorkspaceRequired';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/useToast';

export const ChatsExplorer: React.FC = () => {
  const { getWorkspaceChats, currentChatId, createChat, deleteChat, renameChat, switchChat } =
    useChatsStore();
  const { openChatPanel } = useUIStore();
  const { workspace } = useWorkspace();
  const { isGraphLocked } = useGraphStore();
  const { toast } = useToast();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['chats']));

  const chats = getWorkspaceChats();

  if (!workspace) {
    return <WorkspaceRequired />;
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleDeleteChat = (chatId: string) => {
    setDeleteConfirmChatId(chatId);
  };

  const confirmDeleteChat = () => {
    if (deleteConfirmChatId) {
      deleteChat(deleteConfirmChatId);
      setDeleteConfirmChatId(null);
    }
  };

  const startEditingChat = (chatId: string, currentName: string) => {
    setEditingChatId(chatId);
    setEditingName(currentName);
  };

  const saveEditingChat = () => {
    if (editingChatId && editingName.trim()) {
      renameChat(editingChatId, editingName.trim());
      setEditingChatId(null);
      setEditingName('');
    }
  };

  const cancelEditingChat = () => {
    setEditingChatId(null);
    setEditingName('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const sortedChats = [...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <div className="flex-1 overflow-auto">
      {}
      <div className="py-1">
        <button
          onClick={() => toggleSection('chats')}
          className="w-full flex items-center gap-1 px-3 py-1.5 hover:bg-accent/50 transition-colors text-sm"
        >
          {expandedSections.has('chats') ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">Chats</span>
          <span className="ml-auto text-xs text-muted-foreground">{chats.length}</span>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (isGraphLocked) {
                toast({
                  variant: 'destructive',
                  title: 'Command Running',
                  description: 'Please wait for the current command to complete.',
                });
                return;
              }
              createChat();
            }}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 ml-1"
            title="New Conversation"
            disabled={isGraphLocked}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </button>

        {expandedSections.has('chats') && (
          <div className="px-3">
            {sortedChats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Click + to create</p>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative rounded-md transition-colors ${
                      chat.id === currentChatId
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-accent/50 border border-transparent'
                    }`}
                  >
                    {editingChatId === chat.id ? (
                      <div className="flex items-center gap-1 p-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingChat();
                            if (e.key === 'Escape') cancelEditingChat();
                          }}
                          className="h-6 text-xs"
                          autoFocus
                        />
                        <Button
                          onClick={saveEditingChat}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={cancelEditingChat}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (isGraphLocked) {
                            toast({
                              variant: 'destructive',
                              title: 'Command Running',
                              description:
                                'Please wait for the current command to complete before switching chats.',
                            });
                            return;
                          }
                          switchChat(chat.id);
                          openChatPanel();
                        }}
                        className={`flex items-start p-2 ${isGraphLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{chat.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{chat.messages.length} messages</span>
                            <span>•</span>
                            <span>{formatDate(chat.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isGraphLocked) return;
                              startEditingChat(chat.id, chat.name);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            title="Rename"
                            disabled={isGraphLocked}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isGraphLocked) return;
                              handleDeleteChat(chat.id);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            title="Delete"
                            disabled={isGraphLocked}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmChatId !== null}
        onClose={() => setDeleteConfirmChatId(null)}
        onConfirm={confirmDeleteChat}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
