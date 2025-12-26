import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../lib/types'
import { useAuth } from '../hooks/useAuth'

export function RoleGate({ allow }: { allow: UserRole[] }) {
  const { loading, role, profile } = useAuth()
  if (loading) return null

  // Usuário autenticado mas ainda não está vinculado a uma org.
  if (profile && !profile.org_id) return <Navigate to="/pendente" replace />

  if (!role) return <Navigate to="/login" replace />
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}


