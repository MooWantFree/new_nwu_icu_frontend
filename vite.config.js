import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
          },
        },
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api/disk': {
        target: 'https://resour.nwu.icu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/disk/, '/api'),
      },
      '/api': {
        target: 'https://nwu.icu',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
