import { fileURLToPath, URL } from 'node:url'
import { execFileSync } from 'node:child_process'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const publicScriptPolicy = "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;"
const managementScriptPolicy = "script-src 'self' moz-extension: chrome-extension:;"

const isManagementRequest = (url = '') => {
  const pathname = url.split(/[?#]/, 1)[0]
  return pathname === '/manage' || pathname.startsWith('/manage/')
}

const readGitCommit = (directory) => {
  try {
    return execFileSync('git', ['-c', `safe.directory=${directory}`, 'rev-parse', 'HEAD'], {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendApiUrl = env.VITE_BACKEND_API_URL || 'https://nwu.icu'
  const frontendCommit = process.env.VITE_FRONTEND_COMMIT
    || env.VITE_FRONTEND_COMMIT
    || readGitCommit(process.cwd())
    || 'unknown'
  const backendCommit = process.env.VITE_BACKEND_COMMIT
    || env.VITE_BACKEND_COMMIT
    || readGitCommit(fileURLToPath(new URL('../NWU.ICU', import.meta.url)))
    || 'unknown'

  return {
    define: {
      'import.meta.env.VITE_FRONTEND_COMMIT': JSON.stringify(frontendCommit),
      'import.meta.env.VITE_BACKEND_COMMIT': JSON.stringify(backendCommit),
    },
    plugins: [
      {
        name: 'management-passkey-csp',
        transformIndexHtml: {
          order: 'pre',
          handler(html, context) {
            // KeePassXC-Browser injects its WebAuthn bridge into the page from
            // moz-extension:// (or chrome-extension://). Keep that exception
            // limited to the management document during local development.
            if (!context.server || !isManagementRequest(context.originalUrl || context.path)) return html
            return html.replace(publicScriptPolicy, managementScriptPolicy)
          },
        },
      },
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
        '/api': {
          target: backendApiUrl,
          changeOrigin: true,
          xfwd: true,
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
