import { BrowserRouter, HashRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { WorkspaceProvider, useWorkspace } from '../contexts/WorkspaceContext';
import { useChatsStore } from '../store/chatsStore';
import { useDeveloperSettingsStore } from '../store/developerSettingsStore';
import { useGraphAutosave } from '../hooks/useGraphAutosave';
import ErrorBoundary from './ErrorBoundary';
import AppRouter from './Router';
import LoadingScreen from '../components/LoadingScreen';
import { SmartIndexingInitializer } from '../components/indexing/SmartIndexingInitializer';
import { IndexingStatus } from '../components/indexing/IndexingStatus';

const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const hasElectronUA = userAgent.includes('electron');
  const hasWindowElectron = !!(window as any).electron;
  const hasProcessType = !!(window as any).process?.type;

  const result = hasElectronUA || hasWindowElectron || hasProcessType;

  return result;
};

const Router = isElectron() ? HashRouter : BrowserRouter;

function AppContent() {
  const { loading: workspaceLoading, workspace } = useWorkspace();
  const setWorkspace = useChatsStore((state) => state.setWorkspace);
  const isSmartIndexingEnabled = useDeveloperSettingsStore((state) => state.isSmartIndexingEnabled);

  useGraphAutosave();

  useEffect(() => {
    setWorkspace(workspace?.path || null);
  }, [workspace?.path, setWorkspace]);

  if (workspaceLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {isSmartIndexingEnabled && (
        <>
          <SmartIndexingInitializer />
          <IndexingStatus />
        </>
      )}
      <AppRouter />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <WorkspaceProvider>
          <AppContent />
        </WorkspaceProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
