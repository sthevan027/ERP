import { type Session } from '@supabase/supabase-js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured, USE_DEMO } from '../../lib/supabaseClient'
import type { Profile } from '../../lib/types'
import { AuthContext, type AuthState } from './authContext'
import { errorMessage } from '../../lib/errors'
import { queryWithRetry, translateDbError } from '../../lib/dbClient'
import { demoProfiles } from '../../lib/demoStorage'

async function fetchProfile(userId: string): Promise<Profile | null> {
  // Em modo demo, usa o storage local
  if (USE_DEMO) {
    return await demoProfiles.get(userId)
  }

  try {
    const data = await queryWithRetry<Profile>(() =>
      supabase
        .from('profiles')
        .select('user_id, org_id, role, client_id, full_name')
        .eq('user_id', userId)
        .single(),
    )
    return data
  } catch (error: unknown) {
    // Se não encontrou o perfil, retorna null (usuário ainda não vinculado)
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'PGRST116') {
      return null
    }
    // Loga o erro mas não quebra o app - o usuário pode estar em processo de vinculação
    console.error('Erro ao buscar perfil:', translateDbError(error))
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!supabaseConfigured) {
      setProfile(null)
      return
    }
    try {
      const s = (await supabase.auth.getSession()).data.session
      if (!s) {
        setProfile(null)
        return
      }
      const p = await fetchProfile(s.user.id)
      setProfile(p)
    } catch (err) {
      console.error('Erro ao atualizar profile:', err)
      // Se der erro, tenta buscar novamente - pode ser que o profile ainda não exista
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function init() {
      setLoading(true)
      setInitError(null)
      try {
        if (!supabaseConfigured) {
          setSession(null)
          setProfile(null)
          return
        }

        const { data } = await supabase.auth.getSession()
        if (!alive) return
        setSession(data.session ?? null)

        if (data.session) {
          try {
            const p = await fetchProfile(data.session.user.id)
            if (!alive) return
            setProfile(p)
          } catch {
            if (!alive) return
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
      } catch (e: unknown) {
        if (!alive) return
        setSession(null)
        setProfile(null)
        setInitError(errorMessage(e, 'Falha ao inicializar autenticação (Supabase)'))
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    init()

    if (!supabaseConfigured) {
      return () => {
        alive = false
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: string, newSession: Session | null) => {
      if (!alive) return
      setSession(newSession)
      if (newSession) {
        try {
          const p = await fetchProfile(newSession.user.id)
          if (!alive) return
          setProfile(p)
        } catch (err) {
          if (!alive) return
          console.error('Erro ao buscar perfil após login:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    // Em modo demo, não precisa verificar supabaseConfigured
    if (!USE_DEMO && !supabaseConfigured) {
      throw new Error('Supabase não configurado (verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)')
    }
    
    // Em modo demo, não precisa de timeout
    if (USE_DEMO) {
      // Garante que email é string antes de fazer trim
      const emailStr = typeof email === 'string' ? email.trim() : String(email).trim()
      const { error } = await supabase.auth.signInWithPassword({ email: emailStr, password })
      if (error) {
        throw new Error(error.message || 'Falha ao fazer login')
      }
      return
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)
    
    try {
      // Garante que email é string antes de fazer trim
      const emailStr = typeof email === 'string' ? email.trim() : String(email).trim()
      const { error } = await supabase.auth.signInWithPassword({ email: emailStr, password })
      clearTimeout(timeoutId)
      if (error) {
        throw new Error(error.message || 'Falha ao fazer login')
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Timeout ao conectar com Supabase. Verifique sua conexão e as variáveis de ambiente.')
      }
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null
    const role = profile?.role ?? null
    const orgId = profile?.org_id ?? null
    const clientId = profile?.client_id ?? null

    return {
      loading,
      initError,
      session,
      user,
      profile,
      role,
      orgId,
      clientId,
      signInWithPassword,
      signOut,
      refreshProfile,
    }
  }, [loading, initError, session, profile, signInWithPassword, signOut, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


