import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version?: string };
const appVersion = packageJson.version || '0.0.0';

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

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'framework';
          }

          if (id.includes('/@supabase/')) {
            return 'supabase';
          }

          if (id.includes('/lucide-react/')) {
            return 'icons';
          }

          if (id.includes('/sonner/')) {
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
