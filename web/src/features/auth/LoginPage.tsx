import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../app/hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { errorMessage } from '../../lib/errors'
import { USE_DEMO } from '../../lib/supabaseClient'
import { EyeIcon, EyeOffIcon, BuildingIcon, AlertCircleIcon } from '../../components/icons'

export function LoginPage() {
  const { session, loading, signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      const emailStr = String(email || '').trim()
      const passwordStr = String(password || '')

      if (!emailStr || !passwordStr) {
        setError('Preencha e-mail e senha.')
        return
      }

      await signInWithPassword(emailStr, passwordStr)
    } catch (err: unknown) {
      const msg = errorMessage(err, 'Falha ao entrar')
      setError(msg)
      console.error('Erro no login:', err)
    } finally {
      setBusy(false)
    }
  }

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
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
            }}
          >
            <BuildingIcon size={32} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
            ERP Galpão
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sistema de Gerenciamento de Armazenagem
          </p>
        </div>

        {/* Demo Banner */}
        {USE_DEMO && (
          <div
            style={{
              background: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-md)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--info)', marginBottom: 'var(--space-xs)' }}>
              Modo Demonstração
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sistema funcionando com dados locais. Credenciais:
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <code style={{ fontSize: '0.7rem' }}>gestor@demo.com / Gestor123!</code>
                <code style={{ fontSize: '0.7rem' }}>analista@demo.com / Analista123!</code>
                <code style={{ fontSize: '0.7rem' }}>cliente@demo.com / Cliente123!</code>
              </div>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
            Entrar
          </h2>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                E-mail
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                Senha
              </label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'color 150ms ease',
                    }}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                }
              />
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-md)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircleIcon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={busy} fullWidth style={{ marginTop: 'var(--space-sm)' }}>
              {busy ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © 2025 ERP Galpão · Sistema de Armazenagem
          </p>
        </div>
      </div>
    </div>
  )
}
