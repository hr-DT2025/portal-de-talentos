/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CHAT_WEBHOOK_URL: string
  readonly GOOGLE_CHAT_WEBHOOK_URL: string
  readonly VITE_API_KEY: string
  readonly API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
