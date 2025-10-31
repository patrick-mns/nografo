import { useEffect, useCallback } from 'react';
import { useShortcutsStore } from '@/store/shortcutsStore';
import { matchesShortcut } from '@/types/shortcuts';
import type { KeyboardShortcutAction } from '@/types/shortcuts';

type ShortcutHandler = () => void;

interface UseKeyboardShortcutsOptions {
  shortcuts: Partial<Record<KeyboardShortcutAction, ShortcutHandler>>;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts: handlers,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const { shortcuts } = useShortcutsStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Handle delete/backspace for selected nodes
        console.log('Delete/Backspace key pressed');
      }

      for (const [action, handler] of Object.entries(handlers)) {
        const shortcut = shortcuts[action];
        if (shortcut && shortcut.enabled && matchesShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          handler();
          break;
        }
      }
    },
    [enabled, handlers, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export function useShortcut(action: KeyboardShortcutAction) {
  const { getShortcut } = useShortcutsStore();
  return getShortcut(action);
}

export function useShortcutsByCategory(category: string) {
  const { getShortcutsByCategory } = useShortcutsStore();
  return getShortcutsByCategory(category);
}
