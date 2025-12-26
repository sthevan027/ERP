import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '../../lib/types'

export type AuthState = {
  loading: boolean
  initError: string | null
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  orgId: string | null
  clientId: string | null
  signInWithPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)


