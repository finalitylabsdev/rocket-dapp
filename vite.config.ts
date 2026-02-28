import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version?: string };
const appVersion = packageJson.version || '0.0.0';

function inNodeModulePackage(id: string, pkg: string): boolean {
  return id.includes(`/node_modules/${pkg}/`);
}

function inNodeModuleScope(id: string, scope: string): boolean {
  return id.includes(`/node_modules/${scope}/`);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (
            inNodeModulePackage(id, 'react')
            || inNodeModulePackage(id, 'react-dom')
            || inNodeModulePackage(id, 'scheduler')
          ) {
            return 'framework';
          }

          if (
            inNodeModulePackage(id, 'ethers')
            || inNodeModuleScope(id, '@ethersproject')
          ) {
            return 'chain';
          }

          if (inNodeModuleScope(id, '@supabase')) {
            return 'supabase';
          }

          if (inNodeModulePackage(id, 'lucide-react')) {
            return 'icons';
          }

          if (inNodeModulePackage(id, 'sonner')) {
            return 'ui';
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
