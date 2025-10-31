import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMode = 'normal' | 'command';

export interface DeveloperSettings {
  isDeveloperMode: boolean;
  chatMode: ChatMode;
  isSmartIndexingEnabled: boolean;
  isIncrementalStreamEnabled: boolean;
  toggleDeveloperMode: () => void;
  setChatMode: (mode: ChatMode) => void;
  toggleSmartIndexing: () => void;
  setSmartIndexing: (enabled: boolean) => void;
  toggleIncrementalStream: () => void;
  setIncrementalStream: (enabled: boolean) => void;
}

export const useDeveloperSettingsStore = create<DeveloperSettings>()(
  persist(
    (set) => ({
      isDeveloperMode: false,
      chatMode: 'normal',
      isSmartIndexingEnabled: false,
      isIncrementalStreamEnabled: true,
      toggleDeveloperMode: () => set((state) => ({ isDeveloperMode: !state.isDeveloperMode })),
      setChatMode: (mode) => set({ chatMode: mode }),
      toggleSmartIndexing: () =>
        set((state) => ({ isSmartIndexingEnabled: !state.isSmartIndexingEnabled })),
      setSmartIndexing: (enabled) => set({ isSmartIndexingEnabled: enabled }),
      toggleIncrementalStream: () =>
        set((state) => ({ isIncrementalStreamEnabled: !state.isIncrementalStreamEnabled })),
      setIncrementalStream: (enabled) => set({ isIncrementalStreamEnabled: enabled }),
    }),
    {
      name: 'developer-settings-storage',
    }
  )
);
