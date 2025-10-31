// App Identity
export const APP_NAME = 'Nografo';
export const APP_NAME_SLUG = 'nografo';
export const APP_VERSION = '1.0.0';
export const API_VERSION = 'v1';

// Company/Project Info
export const PROJECT_NAME = 'Nografo Project';
export const APP_ID = 'com.nografo.app';
export const GITHUB_REPO = 'https://github.com/patrick-mns/nografo';

// Contact
export const CONTACT_EMAIL = 'patrick@nografo.com';
export const AI_EMAIL = 'ai@nografo.dev';

// API URLs - Environment-based for development, fixed for production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.nografo.com';
export const API_FULL_URL = `${API_BASE_URL}/api`;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  WORKSPACE_STATE: 'workspace_state',
  GRAPH_STATE: 'graph_state',
  UI_STATE: 'nografo-ui-state',
  WORKSPACE: 'nografo_workspace',
  GRAPHS: 'nografo_graphs',
  FILES: 'nografo_files',
} as const;

// File Extensions
export const FILE_EXTENSIONS = {
  CONFIG: '.nografo',
  GRAPH: '.json',
} as const;

export const MAX_NODES = 1000;
export const DEFAULT_NODE_SIZE = 10;
export const DEFAULT_LINK_DISTANCE = 100;

export const DEFAULT_THEME = 'vs-dark';
export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'cpp',
  'c',
  'markdown',
  'json',
  'yaml',
  'html',
  'css',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_CONTEXT_SIZE = 100 * 1024;

export const ROUTES = {
  HOME: '/',
  EDITOR: '/editor',
  GRAPH: '/graph/:id',
  SETTINGS: '/settings',
} as const;

export const NODE_TYPES = {
  FILE: 'file',
  FOLDER: 'folder',
  FUNCTION: 'function',
  CLASS: 'class',
  VARIABLE: 'variable',
  CUSTOM: 'custom',
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

export const GRAPH_MODES = {
  '2D': '2d',
  '3D': '3d',
} as const;

export type GraphMode = (typeof GRAPH_MODES)[keyof typeof GRAPH_MODES];

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];
