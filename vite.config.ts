import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-version',
      closeBundle() {
        const version = Date.now().toString();
        console.log(`Building with version: ${version}`);

        const swPath = resolve(__dirname, 'dist/sw.js');
        try {
          const swContent = readFileSync(swPath, 'utf-8');
          const updatedContent = swContent.replace(/__APP_VERSION__/g, version);
          writeFileSync(swPath, updatedContent);
          console.log('Service Worker version injected successfully');
        } catch (error) {
          console.warn('Could not inject version into service worker:', error);
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
});
