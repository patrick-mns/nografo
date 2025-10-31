import React from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Focus, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomControlsProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  is3DView: boolean;
  setIs3DView: (is3D: boolean) => void;
  isForced3D?: boolean;
}

const CustomControls: React.FC<CustomControlsProps> = ({
  className,
  position = 'bottom-left',
  setIs3DView,
  isForced3D = false,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = () => zoomIn();
  const handleZoomOut = () => zoomOut();
  const handleFitView = () => fitView({ padding: 0.2 });

  return (
    <Panel position={position} className={cn('flex flex-col gap-1', className)}>
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-1">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitView}
            className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            title="Fit View"
          >
            <Focus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIs3DView(true)}
            className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
            title={isForced3D ? '3D view (locked for large graphs)' : 'Switch to 3D view'}
          >
            <Box className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Panel>
  );
};

export default CustomControls;
