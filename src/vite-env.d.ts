/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GRAPH_3D_FORCE_NODE_LIMIT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
