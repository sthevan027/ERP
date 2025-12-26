import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../app/hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { env } from '../../lib/env'
import { errorMessage } from '../../lib/errors'

function timeout(ms: number) {
  return new Promise<never>((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id)
      reject(
        new Error(
          'Timeout ao tentar logar. Verifique VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY e se sua rede está liberando acesso ao Supabase.',
        ),
      )
    }, ms)
  })
}

export function LoginPage() {
  const { session, loading, signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagOpen, setDiagOpen] = useState(false)
  const [diagBusy, setDiagBusy] = useState(false)
  const [diagResult, setDiagResult] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      // Evita “travado em Entrando…” quando o request fica pendurado (rede/config).
      await Promise.race([signInWithPassword(email.trim(), password), timeout(12000)])
    } catch (err: unknown) {
      setError(errorMessage(err, 'Falha ao entrar'))
    } finally {
      setBusy(false)
    }
  }

  async function testConnection() {
    setDiagBusy(true)
    setDiagResult(null)
    try {
      if (!env.supabaseUrl || !env.supabaseAnonKey) {
        setDiagResult(`Faltando env: ${env.missing.join(', ')}`)
        return
      }

      const url = `${env.supabaseUrl.replace(/\/$/, '')}/auth/v1/health`
      const res = await Promise.race([
        fetch(url, {
          method: 'GET',
          headers: {
            apikey: env.supabaseAnonKey,
            Authorization: `Bearer ${env.supabaseAnonKey}`,
          },
        }),
        timeout(12000),
      ])

      if (!('ok' in res)) {
        // nunca deve acontecer, mas ajuda o TS
        throw new Error('Resposta inválida do teste de conexão')
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setDiagResult(`HTTP ${res.status} ao acessar ${url}\n${text || '(sem body)'}`)
        return
      }

      const text = await res.text().catch(() => '')
      setDiagResult(`OK (${res.status}) em ${url}\n${text || '(sem body)'}`)
    } catch (e: unknown) {
      setDiagResult(errorMessage(e, 'Falha no teste de conexão'))
    } finally {
      setDiagBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Entrar</h2>
        <p className="muted" style={{ marginTop: -6 }}>
          Use o e-mail e senha cadastrados no Supabase Auth.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>
              E-mail
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>
              Senha
            </label>
            <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <div style={{ flex: 1 }}>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.45)' }}>
              <strong>Erro</strong>
              <div className="muted" style={{ marginTop: 6 }}>
                {error}
              </div>
            </div>
          )}

          <div className="card" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <strong>Diagnóstico</strong>
              <Button type="button" variant="ghost" onClick={() => setDiagOpen((v) => !v)}>
                {diagOpen ? 'Fechar' : 'Abrir'}
              </Button>
            </div>
            {diagOpen && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Supabase URL:{' '}
                  <code>{env.supabaseUrl ? env.supabaseUrl : '(não configurado)'}</code>
                  <br />
                  ANON key:{' '}
                  <code>{env.supabaseAnonKey ? `(${env.supabaseAnonKey.length} chars)` : '(não configurado)'}</code>
                </div>

                <div className="row">
                  <Button type="button" disabled={diagBusy} onClick={testConnection}>
                    {diagBusy ? 'Testando...' : 'Testar conexão com Supabase'}
                  </Button>
                </div>

                {diagResult && (
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 10,
                      background: 'rgba(0,0,0,0.18)',
                    }}
                  >
                    {diagResult}
                  </pre>
                )}
              </div>
            )}
          </div>

          <Button disabled={busy} type="submit">
            {busy ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}


