import { useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { useShortcutsStore } from '@/store/shortcutsStore';
import { formatShortcutKeys } from '@/types/shortcuts';
import type { KeyboardShortcut } from '@/types/shortcuts';
import { useToast } from '@/hooks/useToast';

interface ShortcutCategoryGroup {
  category: string;
  label: string;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsPanel() {
  const { shortcuts, toggleShortcut, resetShortcut, resetAllShortcuts } = useShortcutsStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const categories: ShortcutCategoryGroup[] = [
    { category: 'graph', label: 'Graph Actions', shortcuts: [] },
    { category: 'node', label: 'Node Actions', shortcuts: [] },
    { category: 'edge', label: 'Edge Actions', shortcuts: [] },
    { category: 'view', label: 'View Actions', shortcuts: [] },
    { category: 'navigation', label: 'Navigation', shortcuts: [] },
    { category: 'terminal', label: 'Terminal Actions', shortcuts: [] },
    { category: 'edit', label: 'Edit Actions', shortcuts: [] },
    { category: 'general', label: 'General', shortcuts: [] },
  ];

  Object.values(shortcuts).forEach((shortcut) => {
    const category = categories.find((c) => c.category === shortcut.category);
    if (category) {
      category.shortcuts.push(shortcut);
    }
  });

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        (shortcut) =>
          shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatShortcutKeys(shortcut.keys).toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.shortcuts.length > 0);

  const handleResetAll = () => {
    resetAllShortcuts();
    toast({
      title: 'Shortcuts reset',
      description: 'All keyboard shortcuts have been reset to defaults.',
    });
  };

  const handleResetShortcut = (action: KeyboardShortcut['action']) => {
    resetShortcut(action);
    toast({
      title: 'Shortcut reset',
      description: 'Keyboard shortcut has been reset to default.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Keyboard Shortcuts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize keyboard shortcuts for various actions throughout the application.
        </p>
      </div>

      {}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </Button>
      </div>

      {}
      <div className="space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No shortcuts found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.category} className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                {category.label}
              </h4>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{shortcut.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{shortcut.action}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      {}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border">
                        <kbd className="text-xs font-mono font-semibold">
                          {formatShortcutKeys(shortcut.keys)}
                        </kbd>
                      </div>

                      {}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={shortcut.enabled}
                          onCheckedChange={() => toggleShortcut(shortcut.action)}
                        />
                        <span className="text-xs text-muted-foreground w-16">
                          {shortcut.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetShortcut(shortcut.action)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Reset to default"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {}
      <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> "Mod" represents Cmd on macOS and Ctrl
          on Windows/Linux. Some shortcuts may conflict with system or browser shortcuts.
        </p>
      </div>
    </div>
  );
}
