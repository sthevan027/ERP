type EnvStatus = {
  supabaseUrl?: string
  supabaseAnonKey?: string
  missing: string[]
  configured: boolean
}

export const env: EnvStatus = (() => {
  type EnvRecord = Record<string, string | boolean | undefined>
  const metaEnv = import.meta.env as unknown as EnvRecord
  const supabaseUrl = (metaEnv.VITE_SUPABASE_URL as string | undefined) || undefined
  const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string | undefined) || undefined

  const missing: string[] = []
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')

  return {
    supabaseUrl,
    supabaseAnonKey,
    missing,
    configured: missing.length === 0,
  }
})()


