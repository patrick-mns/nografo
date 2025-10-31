import { useEffect, useRef } from 'react';
import { useSmartIndexing } from '@/hooks/useSmartIndexing';
import { useWorkspace } from '@/hooks/useWorkspace';

export function SmartIndexingInitializer() {
  const { workspace, isElectronEnv } = useWorkspace();
  const { initialize, isAvailable, isEnabled } = useSmartIndexing();
  const initializingRef = useRef(false);
  const lastWorkspaceRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isElectronEnv ||
      !isAvailable ||
      !isEnabled ||
      !workspace ||
      initializingRef.current ||
      lastWorkspaceRef.current === workspace.path
    ) {
      return;
    }

    const initializeIndexing = async () => {
      initializingRef.current = true;
      lastWorkspaceRef.current = workspace.path;

      try {
        const storagePath = workspace.path;

        const success = await initialize(workspace.path, storagePath);

        if (success) {
          console.log('[SmartIndexing] ✅ Initialized successfully');
        } else {
          console.error('[SmartIndexing] ❌ Initialization failed');

          lastWorkspaceRef.current = null;
        }
      } catch (error) {
        console.error('[SmartIndexing] ❌ Initialization error:', error);

        lastWorkspaceRef.current = null;
      } finally {
        initializingRef.current = false;
      }
    };

    initializeIndexing();
  }, [workspace, isElectronEnv, isAvailable, isEnabled, initialize]);

  useEffect(() => {
    if (!workspace) {
      lastWorkspaceRef.current = null;
      initializingRef.current = false;
    }
  }, [workspace]);

  return null;
}
