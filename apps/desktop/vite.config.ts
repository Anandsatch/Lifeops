import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri expects a fixed port and doesn't tolerate Vite's auto-incrementing
// fallback. See https://v2.tauri.app/start/frontend/vite/
const TAURI_DEV_HOST = process.env['TAURI_DEV_HOST'];

const serverConfig = {
  port: 1420,
  strictPort: true as const,
  host: TAURI_DEV_HOST || (false as const),
  watch: { ignored: ['**/src-tauri/**'] },
  ...(TAURI_DEV_HOST
    ? {
        hmr: {
          protocol: 'ws' as const,
          host: TAURI_DEV_HOST,
          port: 1421,
        },
      }
    : {}),
};

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: serverConfig,
  // Tauri uses Chromium on Windows and WebKit on macOS / Linux
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
  },
});
