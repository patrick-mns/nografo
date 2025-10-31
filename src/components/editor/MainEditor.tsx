import { useState, useEffect } from 'react';
import GraphCanvas from '../graph/GraphCanvas';
import GraphCanvas3D from '../graph/GraphCanvas3D';
import GraphHeader from '../graph/GraphHeader';
import SidePanel from '../layout/SidePanel';
import GridBackground from '../graph/GridBackground';
import { WorkspaceBar } from '../workspace/WorkspaceBar';
import { ResizableSidePanel } from '../layout/ResizableSidePanel';
import { ResizableLeftPanel } from '../layout/ResizableLeftPanel';
import { ChatPanel } from '../chat/ChatPanel';
import { ActivityBar } from '../layout/ActivityBar';
import { Toaster } from '../ui/toaster';
import { MarkdownPreview } from './MarkdownPreview';
import { useGraphStore } from '../../store/graphStore';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { EditShortcutsProvider } from '@/shortcuts/contexts/EditShortcuts';
import { useDeveloperSettingsStore } from '@/store/developerSettingsStore';
import { useUIStore } from '@/store/uiStore';
import { usePanelSize } from '@/hooks/usePanelSizes';

function MainEditor() {
  const {
    isChatPanelOpen,
    isSidePanelOpen,
    isPreviewPanelOpen,
    toggleChatPanel,
    closeChatPanel,
    toggleSidePanel,
    togglePreviewPanel,
    closeSidePanel,
    closePreviewPanel,
  } = useUIStore();
  const [is3DView, setIs3DView] = useState(true);
  const { nodes } = useGraphStore();
  const { saveGraph, refreshGraphs, deleteGraph } = useWorkspace();
  const { chatMode } = useDeveloperSettingsStore();

  const [chatPanelSize, setChatPanelSize] = usePanelSize('chatPanel');
  const [sidePanelSize, setSidePanelSize] = usePanelSize('sidePanel');
  const [previewPanelSize, setPreviewPanelSize] = usePanelSize('previewPanel');

  const FORCE_3D_THRESHOLD = 500;
  const isForced3D = nodes.length >= FORCE_3D_THRESHOLD;

  useEffect(() => {
    if (isForced3D && !is3DView) {
      setIs3DView(true);
    }
  }, [isForced3D, is3DView]);

  return (
    <EditShortcutsProvider>
      <div className="flex flex-col h-screen bg-background overflow-hidden max-h-screen">
        <WorkspaceBar />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <ActivityBar
            isChatPanelOpen={isChatPanelOpen}
            isSidePanelOpen={isSidePanelOpen}
            isPreviewPanelOpen={isPreviewPanelOpen}
            onToggleChat={toggleChatPanel}
            onToggleSidePanel={toggleSidePanel}
            onTogglePreview={togglePreviewPanel}
          />

          {isChatPanelOpen && (
            <ResizableLeftPanel
              defaultWidth={chatPanelSize}
              minWidth={250}
              maxWidth={600}
              onWidthChange={setChatPanelSize}
              onMinimize={closeChatPanel}
            >
              <ChatPanel chatMode={chatMode} />
            </ResizableLeftPanel>
          )}

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <div className="flex-1 relative overflow-hidden transition-all duration-300 ease-in-out">
                <GraphHeader />
                <GridBackground />
                {is3DView ? (
                  <GraphCanvas3D
                    is3DView={is3DView}
                    setIs3DView={setIs3DView}
                    isChatPanelOpen={isChatPanelOpen}
                    isSidePanelOpen={isSidePanelOpen}
                    saveGraph={saveGraph}
                    refreshGraphs={refreshGraphs}
                    deleteGraph={deleteGraph}
                    isForced3D={isForced3D}
                  />
                ) : (
                  <GraphCanvas
                    is3DView={is3DView}
                    setIs3DView={setIs3DView}
                    saveGraph={saveGraph}
                    refreshGraphs={refreshGraphs}
                    deleteGraph={deleteGraph}
                    isForced3D={isForced3D}
                  />
                )}
              </div>

              {isPreviewPanelOpen && (
                <ResizableSidePanel
                  defaultWidth={previewPanelSize}
                  minWidth={300}
                  maxWidth={800}
                  onWidthChange={setPreviewPanelSize}
                  onMinimize={closePreviewPanel}
                >
                  <MarkdownPreview />
                </ResizableSidePanel>
              )}

              {isSidePanelOpen && (
                <ResizableSidePanel
                  defaultWidth={sidePanelSize}
                  minWidth={200}
                  maxWidth={600}
                  onWidthChange={setSidePanelSize}
                  onMinimize={closeSidePanel}
                >
                  <SidePanel />
                </ResizableSidePanel>
              )}
            </div>
          </div>
        </div>

        <Toaster />
      </div>
    </EditShortcutsProvider>
  );
}

export default MainEditor;
