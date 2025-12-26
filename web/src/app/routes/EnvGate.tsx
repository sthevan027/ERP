import { Navigate, Outlet } from 'react-router-dom'
import { supabaseConfigured } from '../../lib/supabaseClient'

export function EnvGate() {
  if (!supabaseConfigured) return <Navigate to="/setup" replace />
  return <Outlet />
}


