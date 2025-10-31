import { create } from 'zustand';
import { API_BASE_URL } from '@/constants';
import { isElectron } from '@/lib/electron';

const SECRETS_STORAGE_KEY = 'cm-secrets';

export interface AIConfig {
  openaiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  selectedProvider: 'openai' | 'anthropic' | 'ollama';
  openaiModel: string;
  anthropicModel: string;
  ollamaModel: string;
  apiEndpoint: 'local' | 'remote';
  localApiUrl: string;
  remoteApiUrl: string;
}

// Legacy interface name for compatibility
export type SecretsConfig = AIConfig;

const isProviderConfigured = (config: AIConfig): boolean => {
  switch (config.selectedProvider) {
    case 'openai':
      return !!config.openaiApiKey;
    case 'anthropic':
      return !!config.anthropicApiKey;
    case 'ollama':
      return !!config.ollamaBaseUrl && !!config.ollamaModel;
    default:
      return false;
  }
};

interface SecretsState {
  config: AIConfig;
  isConfigured: boolean;

  updateConfig: (updates: Partial<AIConfig>) => void;
  clearConfig: () => void;
  isProviderConfigured: (provider: 'openai' | 'anthropic' | 'ollama') => boolean;
}

const defaultConfig: AIConfig = {
  openaiApiKey: '',
  anthropicApiKey: '',
  ollamaBaseUrl: 'http://localhost:11434',
  selectedProvider: 'openai',
  openaiModel: 'gpt-4',
  anthropicModel: 'claude-3-5-sonnet-20241022',
  ollamaModel: 'llama3.1',
  apiEndpoint: 'remote',
  localApiUrl: 'http://localhost:3001',
  remoteApiUrl: API_BASE_URL,
};

const loadSecretsFromStorage = (): AIConfig => {
  try {
    const stored = localStorage.getItem(SECRETS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const config = { ...defaultConfig, ...parsed };

      if (!isElectron() && config.selectedProvider === 'ollama') {
        config.selectedProvider = 'openai';
      }

      return config;
    }
  } catch (error) {
    console.error('Error loading secrets from localStorage:', error);
  }

  const config = { ...defaultConfig };

  if (!isElectron() && config.selectedProvider === 'ollama') {
    config.selectedProvider = 'openai';
  }

  return config;
};

const saveSecretsToStorage = (config: AIConfig) => {
  try {
    localStorage.setItem(SECRETS_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving secrets to localStorage:', error);
  }
};

export const useSecretsStore = create<SecretsState>((set, get) => {
  const initialConfig = loadSecretsFromStorage();

  return {
    config: initialConfig,
    isConfigured: isProviderConfigured(initialConfig),

    updateConfig: (updates) => {
      set((state) => {
        const newConfig = { ...state.config, ...updates };
        saveSecretsToStorage(newConfig);

        const isConfigured = isProviderConfigured(newConfig);

        return {
          config: newConfig,
          isConfigured,
        };
      });
    },

    clearConfig: () => {
      set({
        config: defaultConfig,
        isConfigured: false,
      });
      localStorage.removeItem(SECRETS_STORAGE_KEY);
    },

    isProviderConfigured: (provider) => {
      const { config } = get();
      if (provider === 'openai') {
        return !!config.openaiApiKey;
      }
      if (provider === 'anthropic') {
        return !!config.anthropicApiKey;
      }
      if (provider === 'ollama') {
        return !!config.ollamaBaseUrl;
      }
      return false;
    },
  };
});
