import { useReactFlow } from 'reactflow';

const PAN_AMOUNT = 50;

export function useViewHandlers() {
  const { zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleZoomReset = () => {
    fitView({ duration: 200 });
  };

  const handleFitToScreen = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleCenter = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handlePanUp = () => {
    const viewport = getViewport();
    setViewport({
      ...viewport,
      y: viewport.y + PAN_AMOUNT,
    });
  };

  const handlePanDown = () => {
    const viewport = getViewport();
    setViewport({
      ...viewport,
      y: viewport.y - PAN_AMOUNT,
    });
  };

  const handlePanLeft = () => {
    const viewport = getViewport();
    setViewport({
      ...viewport,
      x: viewport.x + PAN_AMOUNT,
    });
  };

  const handlePanRight = () => {
    const viewport = getViewport();
    setViewport({
      ...viewport,
      x: viewport.x - PAN_AMOUNT,
    });
  };

  return {
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleFitToScreen,
    handleCenter,
    handlePanUp,
    handlePanDown,
    handlePanLeft,
    handlePanRight,
  };
}
