export interface User {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

export interface GraphNode {
  id: string;
  data: {
    label: string;
    description?: string;
    type?: string;
    [key: string]: any;
  };
  position: {
    x: number;
    y: number;
    z?: number;
  };
  type?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    label?: string;
    [key: string]: any;
  };
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Graph {
  id: string;
  name: string;
  description: string;
  data: GraphData;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  repository_owner?: string;
  repository_name?: string;
  repository_path?: string;
  repository_branch?: string;
  sync_enabled?: boolean;
}

export interface CreateGraphPayload {
  name: string;
  description?: string;
  data: GraphData;
  is_public?: boolean;
  repository_owner?: string;
  repository_name?: string;
  repository_path?: string;
  repository_branch?: string;
  sync_enabled?: boolean;
}

export interface UpdateGraphPayload {
  name: string;
  description?: string;
  data: GraphData;
  is_public?: boolean;
  repository_owner?: string;
  repository_name?: string;
  repository_path?: string;
  repository_branch?: string;
  sync_enabled?: boolean;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: User;
}

export interface GraphResponse {
  graph?: Graph;
  id?: string;
  name?: string;
  description?: string;
  data?: GraphData;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  repository_owner?: string;
  repository_name?: string;
  repository_path?: string;
  repository_branch?: string;
  sync_enabled?: boolean;
}

export interface GraphListResponse {
  graphs: Graph[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
}

export interface RepositoryContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url?: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  decoded_content?: string;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
}
