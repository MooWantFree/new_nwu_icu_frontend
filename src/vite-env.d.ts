/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_COMMIT: string
  readonly VITE_BACKEND_COMMIT: string
  readonly VITE_FRONTEND_GITHUB_URL: string
  readonly VITE_BACKEND_GITHUB_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
