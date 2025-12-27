import { Navigate } from 'react-router-dom'
import { env } from '../../lib/env'
import { BuildingIcon, AlertCircleIcon } from '../../components/icons'

export function SetupPage() {
  // Se já está configurado, redireciona para login
  if (env.configured) return <Navigate to="/login" replace />

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
      <div style={{ width: '100%', maxWidth: 500 }}>
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

        {/* Setup Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--warning)',
                flexShrink: 0,
              }}
            >
              <AlertCircleIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, marginBottom: 'var(--space-xs)' }}>
                Configuração Necessária
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                As variáveis de ambiente do Supabase não estão configuradas.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Para usar o sistema com banco de dados real, crie o arquivo <code>web/.env.local</code> com as seguintes variáveis:
            </p>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
              }}
            >
              <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=sua-anon-key</div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
              Você encontra essas informações no painel do Supabase em: <br />
              <strong>Project Settings → API → Project URL</strong> e <strong>anon key</strong>
            </p>

            <div className="divider" />

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              <strong>Modo Demonstração:</strong> Se preferir testar sem banco de dados, 
              o sistema funciona automaticamente com dados locais quando o Supabase não está configurado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
