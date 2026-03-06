import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config specifically for Capacitor iOS/mobile app builds
// Usage: npx vite build --config vite.app.config.ts
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-popover', '@radix-ui/react-tooltip'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@hooks': path.resolve(__dirname, './client/src/hooks'),
      '@lib': path.resolve(__dirname, './client/src/lib'),
      '@pages': path.resolve(__dirname, './client/src/pages'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  define: {
    'import.meta.env.VITE_CAPACITOR': JSON.stringify('true'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://scheduledpros.com'),
  },
});
