import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileJson } from 'lucide-react';

interface Graph {
  id: string;
  name: string;
  description?: string;
  source: string;
}

interface GraphSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphs: Graph[];
  onSelectGraph: (graphId: string, graphName: string) => void;
}

export const GraphSelector: React.FC<GraphSelectorProps> = ({
  open,
  onOpenChange,
  graphs,
  onSelectGraph,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Select Graph to Reference</DialogTitle>
          <DialogDescription>
            Choose one of the available graphs below to reference in this node
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {graphs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No graphs available</p>
              <p className="text-xs mt-1">Create some graphs first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {graphs.map((graph) => (
                <div
                  key={`${graph.source}-${graph.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onSelectGraph(graph.id, graph.name)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-primary" />
                      <span className="font-medium">{graph.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {graph.source}
                      </Badge>
                    </div>
                    {graph.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {graph.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
