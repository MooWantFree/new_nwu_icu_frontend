import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const resourceServiceUrl = env.VITE_RESOURCE_SERVICE_URL || 'https://resour.nwu.icu'
  const backendApiUrl = env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8000'

  return {
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
          target: resourceServiceUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/disk/, '/api'),
        },
        '/api': {
          target: backendApiUrl,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
