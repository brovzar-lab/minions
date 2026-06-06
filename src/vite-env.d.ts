/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAPERCLIP_API_URL: string
  readonly VITE_PAPERCLIP_API_KEY: string
  readonly VITE_PAPERCLIP_COMPANY_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
