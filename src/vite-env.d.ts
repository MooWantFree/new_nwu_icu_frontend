/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_COMMIT: string
  readonly VITE_BACKEND_COMMIT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
