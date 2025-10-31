import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useSecretsStore } from '@/store/secretsStore';
import { useToast } from '@/hooks/useToast';
import { isElectron } from '@/lib/electron';
import { openaiModels, anthropicModels } from './constants/aiModels';
import { API_BASE_URL } from '@/constants';

export function AISettingsPanel() {
  const { config, isConfigured, updateConfig } = useSecretsStore();
  const { toast } = useToast();
  const isElectronEnv = isElectron();

  const [localOpenAIKey, setLocalOpenAIKey] = useState(config.openaiApiKey || '');
  const [localAnthropicKey, setLocalAnthropicKey] = useState(config.anthropicApiKey || '');
  const [localOllamaBaseUrl, setLocalOllamaBaseUrl] = useState(
    config.ollamaBaseUrl || 'http://localhost:11434'
  );
  const [localOllamaModel, setLocalOllamaModel] = useState(config.ollamaModel || 'llama3.1');
  const [localOpenAIModel, setLocalOpenAIModel] = useState(config.openaiModel || 'gpt-4');
  const [localAnthropicModel, setLocalAnthropicModel] = useState(
    config.anthropicModel || 'claude-3-5-sonnet-20241022'
  );
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'ollama'>(
    config.selectedProvider || 'openai'
  );
  const [apiEndpoint, setApiEndpoint] = useState<'local' | 'remote'>(
    isElectronEnv ? config.apiEndpoint || 'remote' : 'remote'
  );
  const [localApiUrl, setLocalApiUrl] = useState(config.localApiUrl || 'http://localhost:3001');
  const [remoteApiUrl, setRemoteApiUrl] = useState(config.remoteApiUrl || API_BASE_URL);

  useEffect(() => {
    if (localOpenAIKey !== config.openaiApiKey) {
      const timeoutId = setTimeout(() => {
        updateConfig({ openaiApiKey: localOpenAIKey });
        if (localOpenAIKey) {
          toast({
            title: 'OpenAI key saved',
            description: 'Your OpenAI API key has been saved automatically.',
          });
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localOpenAIKey, config.openaiApiKey, updateConfig, toast]);

  useEffect(() => {
    if (localAnthropicKey !== config.anthropicApiKey) {
      const timeoutId = setTimeout(() => {
        updateConfig({ anthropicApiKey: localAnthropicKey });
        if (localAnthropicKey) {
          toast({
            title: 'Anthropic key saved',
            description: 'Your Anthropic API key has been saved automatically.',
          });
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localAnthropicKey, config.anthropicApiKey, updateConfig, toast]);

  useEffect(() => {
    if (localOllamaBaseUrl !== config.ollamaBaseUrl) {
      const timeoutId = setTimeout(() => {
        updateConfig({ ollamaBaseUrl: localOllamaBaseUrl });
        toast({
          title: 'Ollama URL saved',
          description: 'Your Ollama base URL has been saved automatically.',
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localOllamaBaseUrl, config.ollamaBaseUrl, updateConfig, toast]);

  useEffect(() => {
    if (localOllamaModel !== config.ollamaModel) {
      const timeoutId = setTimeout(() => {
        updateConfig({ ollamaModel: localOllamaModel });
        toast({
          title: 'Ollama model saved',
          description: 'Your Ollama model has been saved automatically.',
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localOllamaModel, config.ollamaModel, updateConfig, toast]);

  useEffect(() => {
    if (localOpenAIModel !== config.openaiModel) {
      const timeoutId = setTimeout(() => {
        updateConfig({ openaiModel: localOpenAIModel });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localOpenAIModel, config.openaiModel, updateConfig]);

  useEffect(() => {
    if (localAnthropicModel !== config.anthropicModel) {
      const timeoutId = setTimeout(() => {
        updateConfig({ anthropicModel: localAnthropicModel });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localAnthropicModel, config.anthropicModel, updateConfig]);

  useEffect(() => {
    if (selectedProvider !== config.selectedProvider) {
      updateConfig({ selectedProvider });
      const providerName =
        selectedProvider === 'openai'
          ? 'OpenAI'
          : selectedProvider === 'anthropic'
            ? 'Anthropic'
            : 'Ollama';
      toast({
        title: 'Provider updated',
        description: `AI provider changed to ${providerName}.`,
      });
    }
  }, [selectedProvider, config.selectedProvider, updateConfig, toast]);

  useEffect(() => {
    if (apiEndpoint !== config.apiEndpoint) {
      updateConfig({ apiEndpoint });
      toast({
        title: 'API Endpoint updated',
        description: `Using ${apiEndpoint === 'local' ? 'local' : 'remote'} API endpoint.`,
      });
    }
  }, [apiEndpoint, config.apiEndpoint, updateConfig, toast]);

  useEffect(() => {
    if (remoteApiUrl !== config.remoteApiUrl) {
      const timeoutId = setTimeout(() => {
        updateConfig({ remoteApiUrl });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [remoteApiUrl, config.remoteApiUrl, updateConfig]);

  useEffect(() => {
    if (localApiUrl !== config.localApiUrl) {
      const timeoutId = setTimeout(() => {
        updateConfig({ localApiUrl });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localApiUrl, config.localApiUrl, updateConfig]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">AI Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your AI provider API keys to enable AI-powered features.
        </p>
      </div>

      {}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
        <div
          className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}
        />
        <span className="text-sm font-medium">
          {isConfigured ? 'AI is configured' : 'AI not configured'}
        </span>
      </div>

      {}
      {/* Model Provider */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Model Provider</Label>
        <div className={`grid gap-3 ${isElectronEnv ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            onClick={() => setSelectedProvider('openai')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedProvider === 'openai'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/60'
            }`}
          >
            <div className="font-medium text-sm">OpenAI</div>
            <div className="text-xs text-muted-foreground mt-1">GPT Models</div>
          </button>
          <button
            onClick={() => setSelectedProvider('anthropic')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedProvider === 'anthropic'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/60'
            }`}
          >
            <div className="font-medium text-sm">Anthropic</div>
            <div className="text-xs text-muted-foreground mt-1">Claude Models</div>
          </button>
          {isElectronEnv && (
            <button
              onClick={() => setSelectedProvider('ollama')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedProvider === 'ollama'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border/60'
              }`}
            >
              <div className="font-medium text-sm">Ollama</div>
              <div className="text-xs text-muted-foreground mt-1">Local Models</div>
            </button>
          )}
        </div>
      </div>

      {}
      {selectedProvider === 'openai' && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="openai-key" className="text-sm font-medium">
              OpenAI API Key
            </Label>
            <Input
              id="openai-key"
              type="password"
              value={localOpenAIKey}
              onChange={(e) => setLocalOpenAIKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Dashboard
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-model" className="text-sm font-medium">
              Model
            </Label>
            <select
              id="openai-model"
              value={localOpenAIModel}
              onChange={(e) => setLocalOpenAIModel(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {openaiModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {}
      {selectedProvider === 'anthropic' && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="anthropic-key" className="text-sm font-medium">
              Anthropic API Key
            </Label>
            <Input
              id="anthropic-key"
              type="password"
              value={localAnthropicKey}
              onChange={(e) => setLocalAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Anthropic Console
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anthropic-model" className="text-sm font-medium">
              Model
            </Label>
            <select
              id="anthropic-model"
              value={localAnthropicModel}
              onChange={(e) => setLocalAnthropicModel(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {anthropicModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {}
      {selectedProvider === 'ollama' && isElectronEnv && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ollama-url" className="text-sm font-medium">
              Ollama Base URL
            </Label>
            <Input
              id="ollama-url"
              type="text"
              value={localOllamaBaseUrl}
              onChange={(e) => setLocalOllamaBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The base URL for your Ollama instance. Default is http://localhost:11434
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ollama-model" className="text-sm font-medium">
              Ollama Model
            </Label>
            <Input
              id="ollama-model"
              type="text"
              value={localOllamaModel}
              onChange={(e) => setLocalOllamaModel(e.target.value)}
              placeholder="llama3.1"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The model to use (e.g., llama3.1, mistral, codellama). Make sure the model is pulled
              in Ollama.
            </p>
          </div>
        </div>
      )}

      {}
      <div className="space-y-3">
        <Label className="text-sm font-medium">API</Label>
        {isElectronEnv ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setApiEndpoint('local')}
              className={`p-4 rounded-lg border-2 transition-all ${
                apiEndpoint === 'local'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/60'
              }`}
            >
              <div className="font-medium text-sm">Local API</div>
              <div className="text-xs text-muted-foreground mt-1">Development</div>
            </button>
            <button
              onClick={() => setApiEndpoint('remote')}
              className={`p-4 rounded-lg border-2 transition-all ${
                apiEndpoint === 'remote'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/60'
              }`}
            >
              <div className="font-medium text-sm">Remote API</div>
              <div className="text-xs text-muted-foreground mt-1">Production</div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1">
            <button
              onClick={() => setApiEndpoint('remote')}
              className={`p-4 rounded-lg border-2 transition-all ${
                apiEndpoint === 'remote'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/60'
              }`}
            >
              <div className="font-medium text-sm">Cloud API</div>
              <div className="text-xs text-muted-foreground mt-1">Web version</div>
            </button>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {isElectronEnv && (
            <div className="space-y-2">
              <Label htmlFor="local-api-url" className="text-sm font-medium">
                Local API URL
              </Label>
              <Input
                id="local-api-url"
                type="text"
                value={localApiUrl}
                onChange={(e) => setLocalApiUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                URL for local development (port can be customized)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remote-api-url" className="text-sm font-medium">
              {isElectronEnv ? 'Remote API URL' : 'API URL'}
            </Label>
            <Input
              id="remote-api-url"
              type="text"
              value={remoteApiUrl}
              onChange={(e) => setRemoteApiUrl(e.target.value)}
              placeholder={API_BASE_URL}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {isElectronEnv ? 'URL for remote production server' : 'URL for the API server'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
