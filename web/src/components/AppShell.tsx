import { NavLink, Outlet, type NavLinkProps } from 'react-router-dom'
import { useAuth } from '../app/hooks/useAuth'
import { Button } from './ui/Button'

const linkStyle: NavLinkProps['style'] = ({ isActive }) => ({
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: isActive ? 'rgba(59,130,246,0.20)' : 'rgba(255,255,255,0.04)',
})

export function AppShell() {
  const { role, profile, signOut } = useAuth()

  return (
    <div>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.18)' }}>
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong>ERP Galpão</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {profile?.full_name ?? 'Usuário'} · <span className="badge primary">{role ?? '—'}</span>
            </span>
          </div>

          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <NavLink to="/dashboard" style={linkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/produtos" style={linkStyle}>
              Produtos
            </NavLink>

            {role === 'analyst' && (
              <NavLink to="/recebimentos" style={linkStyle}>
                Recebimentos
              </NavLink>
            )}

            {role === 'manager' && (
              <NavLink to="/config/galpao" style={linkStyle}>
                Config. Galpão
              </NavLink>
            )}

            <Button variant="ghost" onClick={() => signOut()}>
              Sair
            </Button>
          </nav>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}


