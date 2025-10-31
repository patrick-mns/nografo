import { useState, useEffect, useCallback } from 'react';
import { useUIStore, type PanelType } from '../store/uiStore';

export type { PanelType };

export const usePanelSizes = () => {
  const { getPanelSize, setPanelSize, resetPanelSize, resetAllPanelSizes } = useUIStore();

  return {
    getPanelSize,
    setPanelSize,
    resetPanelSize,
    resetAllPanelSizes,
  };
};

export const usePanelSize = (panelType: PanelType) => {
  const { getPanelSize, setPanelSize } = useUIStore();
  const [size, setSize] = useState(() => getPanelSize(panelType));

  useEffect(() => {
    setSize(getPanelSize(panelType));
  }, [getPanelSize, panelType]);

  const updateSize = useCallback(
    (newSize: number) => {
      setSize(newSize);
      setPanelSize(panelType, newSize);
    },
    [panelType, setPanelSize]
  );

  return [size, updateSize] as const;
};
