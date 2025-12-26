import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Importante: NÃO quebrar a aplicação no carregamento caso .env ainda não exista.
// Nessa situação o app renderiza a tela de Setup e bloqueia navegação.
export const supabaseConfigured = env.configured

export const supabase = createClient(env.supabaseUrl ?? 'http://localhost', env.supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})


