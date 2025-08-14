/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  // Add other env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}