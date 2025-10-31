import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useSecretsStore } from '../../store/secretsStore';
import GenericModal from '../ui/generic-modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { isElectron } from '@/lib/electron';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, clearConfig, isProviderConfigured } = useSecretsStore();
  const isElectronEnv = isElectron();

  const [localConfig, setLocalConfig] = useState(config);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const [openAIOpen, setOpenAIOpen] = useState(false);
  const [anthropicOpen, setAnthropicOpen] = useState(false);
  const [ollamaOpen, setOllamaOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setHasChanges(false);
    }
  }, [isOpen, config]);

  const handleInputChange = (field: keyof typeof localConfig, value: string) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfig(localConfig);
    setHasChanges(false);
    onClose();
  };

  const handleClear = () => {
    setShowClearDialog(true);
  };

  const confirmClear = () => {
    clearConfig();
    setLocalConfig({
      openaiApiKey: '',
      anthropicApiKey: '',
      ollamaBaseUrl: 'http://localhost:11434',
      selectedProvider: 'openai',
      openaiModel: 'gpt-4',
      anthropicModel: 'claude-3-5-sonnet-20241022',
      ollamaModel: 'llama3.1',
      apiEndpoint: 'remote',
      localApiUrl: 'http://localhost:3001',
      remoteApiUrl: 'https://api.nografo.com',
    });
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setLocalConfig(config);
    setHasChanges(false);
    setShowUnsavedDialog(false);
    onClose();
  };

  const modalTitle = (
    <>
      <Settings className="h-5 w-5 text-primary" />
      AI Configuration
    </>
  );

  const modalFooter = (
    <div className="flex items-center justify-between w-full">
      <Button onClick={handleClear} variant="outline" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Clear All
      </Button>

      <div className="flex gap-2">
        <Button onClick={handleClose} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <GenericModal
        isOpen={isOpen}
        onClose={handleClose}
        title={modalTitle}
        description="Configure your AI providers and API keys for enhanced context management."
        maxWidth="max-w-4xl"
        showCloseButton={false}
        footer={modalFooter}
      >
        <div className="space-y-6">
          {}
          <Collapsible open={openAIOpen} onOpenChange={setOpenAIOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        OpenAI
                      </CardTitle>
                      {isProviderConfigured('openai') && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Configured
                        </Badge>
                      )}
                    </div>
                    {openAIOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="openai-key"
                        type={showOpenAIKey ? 'text' : 'password'}
                        value={localConfig.openaiApiKey}
                        onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                        placeholder="sk-..."
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      >
                        {showOpenAIKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your key at{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        platform.openai.com
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openai-model">Model</Label>
                    <select
                      id="openai-model"
                      value={localConfig.openaiModel}
                      onChange={(e) => handleInputChange('openaiModel', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {}
          <Collapsible open={anthropicOpen} onOpenChange={setAnthropicOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Anthropic (Claude)
                      </CardTitle>
                      {isProviderConfigured('anthropic') && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Configured
                        </Badge>
                      )}
                    </div>
                    {anthropicOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="anthropic-key"
                        type={showAnthropicKey ? 'text' : 'password'}
                        value={localConfig.anthropicApiKey}
                        onChange={(e) => handleInputChange('anthropicApiKey', e.target.value)}
                        placeholder="sk-ant-..."
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      >
                        {showAnthropicKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your key at{' '}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        console.anthropic.com
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anthropic-model">Model</Label>
                    <select
                      id="anthropic-model"
                      value={localConfig.anthropicModel}
                      onChange={(e) => handleInputChange('anthropicModel', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="claude-opus-4-1-20250805">
                        Claude Opus 4.1 (recommended – coding)
                      </option>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (reasoning)</option>
                      <option value="claude-3-5-sonnet-20241022">
                        Claude 3.5 Sonnet (large context)
                      </option>
                      <option value="claude-3-haiku-20240307">
                        Claude 3 Haiku (faster/cheaper)
                      </option>
                    </select>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Ollama Configuration - Only show in Electron */}
          {isElectronEnv && (
            <Collapsible open={ollamaOpen} onOpenChange={setOllamaOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          Ollama (Local)
                        </CardTitle>
                        {isProviderConfigured('ollama') && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Configured
                          </Badge>
                        )}
                      </div>
                      {ollamaOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="ollama-url">Base URL</Label>
                      <Input
                        id="ollama-url"
                        type="text"
                        value={localConfig.ollamaBaseUrl}
                        onChange={(e) => handleInputChange('ollamaBaseUrl', e.target.value)}
                        placeholder="http://localhost:11434"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        The base URL for your local Ollama instance. Default is http:
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ollama-model">Model</Label>
                      <Input
                        id="ollama-model"
                        type="text"
                        value={localConfig.ollamaModel}
                        onChange={(e) => handleInputChange('ollamaModel', e.target.value)}
                        placeholder="llama3.1"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        The model name (e.g., llama3.1, mistral, codellama). Make sure it's pulled
                        in Ollama.
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {}
          <Collapsible open={providerOpen} onOpenChange={setProviderOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Default Provider</CardTitle>
                    {providerOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Label>Select the default provider for context enhancement</Label>
                    <select
                      value={localConfig.selectedProvider}
                      onChange={(e) =>
                        handleInputChange(
                          'selectedProvider',
                          e.target.value as 'openai' | 'anthropic' | 'ollama'
                        )
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {localConfig.openaiApiKey && <option value="openai">OpenAI</option>}
                      {localConfig.anthropicApiKey && (
                        <option value="anthropic">Anthropic (Claude)</option>
                      )}
                      {isElectronEnv && localConfig.ollamaBaseUrl && (
                        <option value="ollama">Ollama (Local)</option>
                      )}
                      {!localConfig.openaiApiKey &&
                        !localConfig.anthropicApiKey &&
                        (!isElectronEnv || !localConfig.ollamaBaseUrl) && (
                          <option value="" disabled>
                            No providers configured
                          </option>
                        )}
                    </select>
                    {!localConfig.openaiApiKey &&
                      !localConfig.anthropicApiKey &&
                      (!isElectronEnv || !localConfig.ollamaBaseUrl) && (
                        <p className="text-sm text-muted-foreground">
                          Configure at least one provider above to select a default.
                        </p>
                      )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {}
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your API keys are stored locally in your browser and are
              never sent to external servers, except to the OpenAI/Anthropic APIs themselves.
            </AlertDescription>
          </Alert>
        </div>
      </GenericModal>

      {}
      <ConfirmationDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={confirmClear}
        title="Clear All Configurations"
        description="Are you sure you want to clear all configurations? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={confirmClose}
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="default"
      />
    </>
  );
};

export default ConfigModal;
