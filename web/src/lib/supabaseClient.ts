import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import { demoSupabase, USE_DEMO_MODE } from './demoSupabaseClient'

// Modo DEMO: usa localStorage em vez de Supabase real
// Perfeito para demonstrações sem precisar configurar banco
export const USE_DEMO = USE_DEMO_MODE || !env.configured

// Importante: NÃO quebrar a aplicação no carregamento caso .env ainda não exista.
// Nessa situação o app renderiza a tela de Setup e bloqueia navegação.
export const supabaseConfigured = USE_DEMO || env.configured

const DEFAULT_TIMEOUT_MS = 12_000

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  // Se o caller já passou um signal, tenta combiná-lo com o nosso timeout.
  const existingSignal = init?.signal
  let signal: AbortSignal = controller.signal
  if (existingSignal) {
    const anyFn = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any
    if (typeof anyFn === 'function') {
      signal = anyFn([existingSignal, controller.signal])
    } else {
      existingSignal.addEventListener(
        'abort',
        () => {
          try {
            controller.abort()
          } catch {
            // noop
          }
        },
        { once: true },
      )
      signal = controller.signal
    }
  }

  return fetch(input, { ...(init ?? {}), signal }).finally(() => clearTimeout(timeoutId))
}

// Se estiver em modo demo, usa o mock. Senão, usa Supabase real.
export const supabase = USE_DEMO
  ? (demoSupabase as any)
  : createClient(env.supabaseUrl ?? 'http://localhost', env.supabaseAnonKey ?? '', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: fetchWithTimeout,
      },
    })


