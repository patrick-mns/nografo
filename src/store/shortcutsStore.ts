import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KeyboardShortcut, KeyboardShortcutAction } from '@/types/shortcuts';
import { DEFAULT_SHORTCUTS } from '@/types/shortcuts';

interface ShortcutsState {
  shortcuts: Record<string, KeyboardShortcut>;
  updateShortcut: (action: KeyboardShortcutAction, keys: string[]) => void;
  toggleShortcut: (action: KeyboardShortcutAction) => void;
  resetShortcut: (action: KeyboardShortcutAction) => void;
  resetAllShortcuts: () => void;
  getShortcut: (action: KeyboardShortcutAction) => KeyboardShortcut | undefined;
  getShortcutsByCategory: (category: string) => KeyboardShortcut[];
}

const defaultShortcutsRecord = DEFAULT_SHORTCUTS.reduce(
  (acc, shortcut) => {
    acc[shortcut.action] = shortcut;
    return acc;
  },
  {} as Record<string, KeyboardShortcut>
);

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: defaultShortcutsRecord,

      updateShortcut: (action, keys) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: {
              ...state.shortcuts[action],
              keys,
            },
          },
        }));
      },

      toggleShortcut: (action) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: {
              ...state.shortcuts[action],
              enabled: !state.shortcuts[action].enabled,
            },
          },
        }));
      },

      resetShortcut: (action) => {
        const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.action === action);
        if (defaultShortcut) {
          set((state) => ({
            shortcuts: {
              ...state.shortcuts,
              [action]: { ...defaultShortcut },
            },
          }));
        }
      },

      resetAllShortcuts: () => {
        set({ shortcuts: defaultShortcutsRecord });
      },

      getShortcut: (action) => {
        return get().shortcuts[action];
      },

      getShortcutsByCategory: (category) => {
        return Object.values(get().shortcuts).filter((s) => s.category === category);
      },
    }),
    {
      name: 'shortcuts-storage',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          return {
            ...persistedState,
            shortcuts: {
              ...defaultShortcutsRecord,
              ...persistedState.shortcuts,
            },
          };
        }
        return persistedState;
      },
    }
  )
);
