export interface PanelSizes {
  chatPanel: number;
  sidePanel: number;
  previewPanel: number;
  bottomPanel: number;
}

export type StoredPanelSizes = Partial<PanelSizes>;
export type PanelType = keyof PanelSizes;

export const DEFAULT_PANEL_SIZES: PanelSizes = {
  chatPanel: 350,
  sidePanel: 280,
  previewPanel: 400,
  bottomPanel: 300,
};
