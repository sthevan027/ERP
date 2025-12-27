import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../app/hooks/useAuth'
import { Button } from './ui/Button'
import {
  DashboardIcon,
  PackageIcon,
  TruckIcon,
  SettingsIcon,
  LogoutIcon,
  BuildingIcon,
} from './icons'

const roleLabels: Record<string, string> = {
  manager: 'Gestor',
  analyst: 'Analista',
  client: 'Cliente',
}

export function AppShell() {
  const { role, profile, signOut } = useAuth()

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} />, roles: ['manager', 'analyst', 'client'] },
    { to: '/produtos', label: 'Produtos', icon: <PackageIcon size={18} />, roles: ['manager', 'analyst', 'client'] },
    { to: '/recebimentos', label: 'Recebimentos', icon: <TruckIcon size={18} />, roles: ['manager', 'analyst'] },
    { to: '/config/galpao', label: 'Config. Galpão', icon: <SettingsIcon size={18} />, roles: ['manager'] },
  ]

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BuildingIcon size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                ERP Galpão
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sistema de Armazenagem
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-bg)' : 'transparent',
                transition: 'all 150ms ease',
                textDecoration: 'none',
                fontWeight: isActive ? 500 : 400,
                fontSize: '0.875rem',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}>
              {(profile?.full_name?.[0] ?? profile?.user_id?.[0] ?? 'U').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {profile?.full_name ?? 'Usuário'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}>
                {roleLabels[role ?? ''] ?? role ?? '—'}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            icon={<LogoutIcon size={16} />}
            style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
          >
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
