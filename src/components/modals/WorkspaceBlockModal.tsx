import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Loader2, Folder } from 'lucide-react';

import { APP_NAME } from '@/constants';

interface WorkspaceBlockModalProps {
  onSelectWorkspace: () => void;
  isLoading?: boolean;
}

const WorkspaceBlockModal: React.FC<WorkspaceBlockModalProps> = ({
  onSelectWorkspace,
  isLoading = false,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {}
      <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-background/98 backdrop-blur-sm border border-border shadow-2xl ring-1 ring-black/10">
          <CardHeader className="text-center space-y-4">
            {}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-xl font-bold text-foreground">
                Workspace Required
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Local Storage
              </Badge>
              <CardDescription className="text-muted-foreground">
                Select a folder to save your graphs locally
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={onSelectWorkspace}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 text-sm"
                size="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Select Workspace Folder
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Your graphs will be saved in{' '}
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">.nografo</code> files
                </p>
              </div>
            </div>

            {}
            <div className="pt-4 border-t border-border">
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>All data is stored locally on your computer</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>No internet connection required after setup</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>You have full control of your data</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">{APP_NAME} • Offline Mode</p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceBlockModal;
