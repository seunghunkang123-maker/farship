

// Manually defining what vite/client provides for import.meta to avoid build errors if package is missing
interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
  // Custom envs
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_IMGUR_CLIENT_ID: string
}

interface ImportMeta {
  url: string
  readonly env: ImportMetaEnv
}
