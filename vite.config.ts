import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isWebMode = mode === 'web';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
    ],
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      global: 'globalThis',
      ...(isWebMode && {
        'process.env.ELECTRON_DISABLE_SECURITY_WARNINGS': 'true',
      }),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      ...(isWebMode && {
        exclude: ['lucide-react', 'electron'],
      }),
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      rollupOptions: {
        ...(isWebMode && {
          external: ['electron', 'fs', 'path', 'os'],
        }),
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: [
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
            ],
            flow: ['reactflow'],
            store: ['zustand'],
            ...(isWebMode && {
              'virtual-workspace': ['@/lib/virtualWorkspace'],
            }),
          },
        },
      },
    },
    server: {
      port: 3000,
      open: !isWebMode,
      strictPort: true,
    },
    preview: {
      port: 4173,
    },
  };
});
