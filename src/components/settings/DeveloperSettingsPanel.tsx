import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useDeveloperSettingsStore } from '@/store/developerSettingsStore';
import { SmartIndexingPanel } from '../debug/SmartIndexingPanel';

export function DeveloperSettingsPanel() {
  const {
    isDeveloperMode,
    chatMode,
    isSmartIndexingEnabled,
    isIncrementalStreamEnabled,
    toggleDeveloperMode,
    setChatMode,
    toggleSmartIndexing,
    toggleIncrementalStream,
  } = useDeveloperSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Developer Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">Customize developer-specific features.</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div>
            <Label htmlFor="incremental-stream" className="text-sm font-medium">
              Incremental Context Streaming
            </Label>
            <p className="text-xs text-muted-foreground">
              Stream context creation in real-time to see the graph being built incrementally.
              (Experimental)
            </p>
          </div>
          <Switch
            id="incremental-stream"
            checked={isIncrementalStreamEnabled}
            onCheckedChange={toggleIncrementalStream}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div>
            <Label htmlFor="smart-indexing" className="text-sm font-medium">
              Smart Indexing
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable intelligent workspace indexing with embeddings for better context retrieval.
              (Experimental - May impact performance)
            </p>
          </div>
          <Switch
            id="smart-indexing"
            checked={isSmartIndexingEnabled}
            onCheckedChange={toggleSmartIndexing}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div>
            <Label htmlFor="developer-mode" className="text-sm font-medium">
              Developer Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable developer-specific features and panels.
            </p>
          </div>
          <Switch
            id="developer-mode"
            checked={isDeveloperMode}
            onCheckedChange={toggleDeveloperMode}
          />
        </div>
        {isDeveloperMode && (
          <>
            <div className="p-4 rounded-lg border border-border">
              <Label className="text-sm font-medium mb-3 block">Chat Mode</Label>
              <RadioGroup
                value={chatMode}
                onValueChange={(value) => setChatMode(value as 'normal' | 'command')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="chat-normal" />
                  <Label htmlFor="chat-normal">Normal</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6 mb-2">
                  Full-featured chat with streaming and conversation.
                </p>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="command" id="chat-command" />
                  <Label htmlFor="chat-command">Command Only</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Limited chat for executing commands only, no streaming.
                </p>
              </RadioGroup>
            </div>

            {}
            {isSmartIndexingEnabled && (
              <div className="mt-6">
                <SmartIndexingPanel />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
