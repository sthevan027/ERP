import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Protected() {
  const { loading, initError, session, profile, role } = useAuth()

  if (loading)
    return (
      <div className="container">
        <div className="card">
          <strong>Carregando...</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            Inicializando autenticação
          </div>
        </div>
      </div>
    )

  if (initError)
    return (
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.45)' }}>
          <strong>Falha ao inicializar</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            {initError}
          </div>
          <div className="muted" style={{ marginTop: 12 }}>
            Confira:
            <ul>
              <li>
                `web/.env.local` com <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>
              </li>
              <li>
                Se você acabou de criar o <code>.env.local</code>, reinicie o <code>pnpm dev</code>
              </li>
              <li>Se o banco não foi criado ainda, rode os SQLs do `supabase/` no Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    )
  if (!session) return <Navigate to="/login" replace />
  
  // Verifica se o usuário está vinculado (tem org_id e role válido)
  if (!profile) return <Navigate to="/pendente" replace />
  if (!profile.org_id || role === 'unassigned') return <Navigate to="/pendente" replace />

  return <Outlet />
}


