import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoredPanelSizes, PanelType } from '../types/ui';
import { DEFAULT_PANEL_SIZES } from '../types/ui';
import { STORAGE_KEYS } from '@/constants';

export type { PanelType };

interface UIState {
  isChatPanelOpen: boolean;
  isSidePanelOpen: boolean;
  isPreviewPanelOpen: boolean;
  panelSizes: StoredPanelSizes;
  openChatPanel: () => void;
  closeChatPanel: () => void;
  toggleChatPanel: () => void;
  openSidePanel: () => void;
  closeSidePanel: () => void;
  toggleSidePanel: () => void;
  openPreviewPanel: () => void;
  closePreviewPanel: () => void;
  togglePreviewPanel: () => void;
  getPanelSize: (panelType: PanelType) => number;
  setPanelSize: (panelType: PanelType, size: number) => void;
  resetPanelSize: (panelType: PanelType) => void;
  resetAllPanelSizes: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isChatPanelOpen: false,
      isSidePanelOpen: false,
      isPreviewPanelOpen: false,
      panelSizes: {},
      openChatPanel: () =>
        set((state) => {
          const currentSize = state.panelSizes.chatPanel;
          const shouldReset = currentSize !== undefined && currentSize < 100;
          return {
            isChatPanelOpen: true,
            panelSizes: shouldReset
              ? { ...state.panelSizes, chatPanel: DEFAULT_PANEL_SIZES.chatPanel }
              : state.panelSizes,
          };
        }),
      closeChatPanel: () => set({ isChatPanelOpen: false }),
      toggleChatPanel: () => set((state) => ({ isChatPanelOpen: !state.isChatPanelOpen })),
      openSidePanel: () =>
        set((state) => {
          const currentSize = state.panelSizes.sidePanel;
          const shouldReset = currentSize !== undefined && currentSize < 100;
          return {
            isSidePanelOpen: true,
            panelSizes: shouldReset
              ? { ...state.panelSizes, sidePanel: DEFAULT_PANEL_SIZES.sidePanel }
              : state.panelSizes,
          };
        }),
      closeSidePanel: () => set({ isSidePanelOpen: false }),
      toggleSidePanel: () => set((state) => ({ isSidePanelOpen: !state.isSidePanelOpen })),
      openPreviewPanel: () =>
        set((state) => {
          const currentSize = state.panelSizes.previewPanel;
          const shouldReset = currentSize !== undefined && currentSize < 100;
          return {
            isPreviewPanelOpen: true,
            panelSizes: shouldReset
              ? { ...state.panelSizes, previewPanel: DEFAULT_PANEL_SIZES.previewPanel }
              : state.panelSizes,
          };
        }),
      closePreviewPanel: () => set({ isPreviewPanelOpen: false }),
      togglePreviewPanel: () => set((state) => ({ isPreviewPanelOpen: !state.isPreviewPanelOpen })),
      getPanelSize: (panelType: PanelType) => {
        const { panelSizes } = get();
        return panelSizes[panelType] ?? DEFAULT_PANEL_SIZES[panelType];
      },
      setPanelSize: (panelType: PanelType, size: number) => {
        set((state) => ({
          panelSizes: { ...state.panelSizes, [panelType]: size },
        }));
      },
      resetPanelSize: (panelType: PanelType) => {
        set((state) => {
          const newSizes = { ...state.panelSizes };
          delete newSizes[panelType];
          return { panelSizes: newSizes };
        });
      },
      resetAllPanelSizes: () => {
        set({ panelSizes: {} });
      },
    }),
    {
      name: STORAGE_KEYS.UI_STATE,
    }
  )
);
