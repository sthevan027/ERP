/**
 * Wrapper melhorado para queries do Supabase
 * - Retry automático para GET requests
 * - Melhor tratamento de erros
 * - Mensagens de erro mais claras
 */

import { PostgrestError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { errorMessage } from './errors'

type QueryOptions = {
  retries?: number
  retryDelay?: number
}

const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY = 1000 // 1 segundo

/**
 * Aguarda um tempo antes de retry
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Verifica se um erro é recuperável (pode tentar novamente)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    // Erros de rede/timeout são recuperáveis
    return (
      msg.includes('fetch failed') ||
      msg.includes('networkerror') ||
      msg.includes('timeout') ||
      msg.includes('aborted') ||
      error.name === 'AbortError'
    )
  }
  return false
}

/**
 * Traduz erros do Supabase/PostgREST em mensagens amigáveis
 */
export function translateDbError(error: unknown): string {
  if (!error) return 'Erro desconhecido'

  // Erro do Supabase/PostgREST
  if (typeof error === 'object' && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError
    const code = pgError.code || ''
    const message = pgError.message || ''

    // Erros de RLS (Row Level Security)
    if (code === 'PGRST301' || message.includes('permission denied') || message.includes('row-level security')) {
      return 'Acesso negado. Você não tem permissão para acessar estes dados. Verifique se está logado e se seu perfil está vinculado a uma organização.'
    }

    // Erro de não encontrado
    if (code === 'PGRST116') {
      return 'Registro não encontrado.'
    }

    // Erro de constraint (unique, foreign key, etc)
    if (code === '23505') {
      return 'Este registro já existe ou está duplicado.'
    }
    if (code === '23503') {
      return 'Referência inválida. Verifique se os dados relacionados existem.'
    }
    if (code === '23502') {
      return 'Campo obrigatório não preenchido.'
    }

    // Erro de autenticação
    if (code === 'PGRST301' || message.includes('JWT')) {
      return 'Sessão expirada. Faça login novamente.'
    }

    return message || 'Erro ao acessar o banco de dados.'
  }

  // Erro genérico
  return errorMessage(error, 'Erro ao conectar com o banco de dados')
}

/**
 * Executa uma query com retry automático (apenas para GET/select)
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: QueryOptions = {},
): Promise<T> {
  const retries = options.retries ?? DEFAULT_RETRIES
  const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY

  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await queryFn()

      if (error) {
        // Erros de RLS ou dados não encontrados não devem fazer retry
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
          throw error
        }

        // Se for erro recuperável e ainda tiver tentativas, tenta novamente
        if (isRetryableError(error) && attempt < retries) {
          lastError = error
          await delay(retryDelay * (attempt + 1)) // Backoff exponencial
          continue
        }

        throw error
      }

      if (data === null) {
        throw new Error('Dados não encontrados')
      }

      return data
    } catch (error) {
      lastError = error

      // Se não for erro recuperável ou acabaram as tentativas, lança o erro
      if (!isRetryableError(error) || attempt >= retries) {
        throw error
      }

      // Aguarda antes de tentar novamente
      await delay(retryDelay * (attempt + 1))
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw lastError || new Error('Falha ao executar query após múltiplas tentativas')
}

/**
 * Executa uma mutation (insert/update/delete) sem retry
 */
export async function mutation<T>(
  mutationFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
): Promise<T | null> {
  const { data, error } = await mutationFn()

  if (error) {
    throw error
  }

  return data
}

/**
 * Verifica a saúde da conexão com o Supabase
 */
export async function checkConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    // Tenta uma query simples que sempre funciona (se RLS permitir)
    const { error } = await supabase.from('profiles').select('user_id').limit(1)

    if (error) {
      // Se for erro de RLS, a conexão está OK, só não tem permissão
      if (error.code === 'PGRST301') {
        return { ok: true, message: 'Conexão OK (RLS ativo)' }
      }
      return { ok: false, message: translateDbError(error) }
    }

    return { ok: true, message: 'Conexão OK' }
  } catch (error) {
    return { ok: false, message: translateDbError(error) }
  }
}

