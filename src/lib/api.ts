import type { ApiError } from '../types/api';
import { API_BASE_URL } from '@/constants';

const getApiBaseURL = (): string => {
  try {
    const stored = localStorage.getItem('cm-secrets');
    if (stored) {
      const config = JSON.parse(stored);

      if (config.apiEndpoint === 'remote' && config.remoteApiUrl) {
        return `${config.remoteApiUrl}/api`;
      }

      if (config.apiEndpoint === 'local' && config.localApiUrl) {
        return `${config.localApiUrl}/api`;
      }

      if (config.apiEndpoint === 'remote') {
        return `${API_BASE_URL}/api`;
      }
      if (config.apiEndpoint === 'local') {
        const envUrl = import.meta.env.VITE_API_URL;
        return envUrl ? `${envUrl}/api` : 'http://localhost:3001/api';
      }
    }
  } catch (error) {
    console.error('Error reading API config:', error);
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  return 'http://localhost:3001/api';
};

class ApiClient {
  constructor() {}

  getBaseURL(): string {
    return getApiBaseURL();
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseURL()}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {}

        const error = new Error(errorMessage) as ApiError;
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`API Error [${options.method || 'GET'}] ${endpoint}:`, error.message);
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
