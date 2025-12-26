import { type Session } from '@supabase/supabase-js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../../lib/supabaseClient'
import type { Profile } from '../../lib/types'
import { AuthContext, type AuthState } from './authContext'
import { errorMessage } from '../../lib/errors'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, org_id, role, client_id, full_name')
    .eq('user_id', userId)
    .single()
  if (error) {
    // Se o usuário ainda não tem perfil vinculado (ex: primeiro login), o RLS permite select self.
    // Ainda assim, `.single()` pode falhar caso não exista linha.
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Profile
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const refreshProfile = useCallback(async () => {
    const s = (await supabase.auth.getSession()).data.session
    if (!s) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(s.user.id)
    setProfile(p)
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

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        try {
          const p = await fetchProfile(newSession.user.id)
          setProfile(p)
        } catch {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
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


