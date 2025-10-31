import { useState, useEffect } from 'react';
import { Plus, CheckCircle, HelpCircle, Trash2 } from 'lucide-react';

export interface SlashCommand {
  command: string;
  description: string;
  icon: React.ReactNode;
  usage?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/create',
    description: 'Create a new graph from scratch',
    icon: <Plus className="w-4 h-4" />,
    usage: '/create <description>',
  },
  {
    command: '/add',
    description: 'Add nodes to existing graph',
    icon: <Plus className="w-4 h-4" />,
    usage: '/add <description>',
  },
  {
    command: '/active',
    description: 'Mark specific nodes as active',
    icon: <CheckCircle className="w-4 h-4" />,
    usage: '/active <criteria>',
  },
  {
    command: '/clear',
    description: 'Clear current graph',
    icon: <Trash2 className="w-4 h-4" />,
    usage: '/clear',
  },
  {
    command: '/help',
    description: 'Show help about commands',
    icon: <HelpCircle className="w-4 h-4" />,
    usage: '/help',
  },
];

export const useSlashCommands = (inputValue: string) => {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);

  useEffect(() => {
    if (inputValue.startsWith('/')) {
      const searchTerm = inputValue.slice(1).toLowerCase();
      const filtered = SLASH_COMMANDS.filter((cmd) =>
        cmd.command.toLowerCase().includes(searchTerm)
      );
      setFilteredCommands(filtered);
      setShowCommandMenu(filtered.length > 0);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, [inputValue]);

  const selectCommand = (command: string) => {
    setShowCommandMenu(false);
    return command + ' ';
  };

  const handleKeyNavigation = (key: string): boolean => {
    if (!showCommandMenu || filteredCommands.length === 0) return false;

    switch (key) {
      case 'ArrowDown':
        setSelectedCommandIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        return true;
      case 'ArrowUp':
        setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        return true;
      case 'Tab':
      case 'Enter':
        if (filteredCommands[selectedCommandIndex]) {
          return true;
        }
        return false;
      case 'Escape':
        setShowCommandMenu(false);
        return true;
      default:
        return false;
    }
  };

  return {
    showCommandMenu,
    selectedCommandIndex,
    filteredCommands,
    selectCommand,
    handleKeyNavigation,
    setShowCommandMenu,
  };
};
