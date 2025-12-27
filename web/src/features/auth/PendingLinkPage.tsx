import { useAuth } from '../../app/hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { ClockIcon, UserIcon } from '../../components/icons'

export function PendingLinkPage() {
  const { profile, refreshProfile, signOut } = useAuth()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        background: 'linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-main) 50%, var(--bg-dark) 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <ClockIcon size={32} style={{ color: 'var(--warning)' }} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
            Acesso Pendente
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
            Sua conta foi criada, mas ainda não foi vinculada a uma organização. 
            Aguarde o administrador configurar seu acesso.
          </p>

          {/* User Info */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-lg)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <UserIcon size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Informações da Conta
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nome:</span>
                <span style={{ color: 'var(--text-primary)' }}>{profile?.full_name ?? 'Não definido'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Organização:</span>
                <span style={{ color: profile?.org_id ? 'var(--text-primary)' : 'var(--warning)' }}>
                  {profile?.org_id ? 'Vinculado' : 'Pendente'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Perfil:</span>
                <span style={{ color: profile?.role && profile.role !== 'unassigned' ? 'var(--text-primary)' : 'var(--warning)' }}>
                  {profile?.role === 'unassigned' || !profile?.role ? 'Pendente' : profile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <Button onClick={refreshProfile} fullWidth>
              Verificar Novamente
            </Button>
            <Button variant="ghost" onClick={() => signOut()} fullWidth>
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
