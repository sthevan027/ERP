import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../app/hooks/useAuth'
import { Button } from '../../components/ui/Button'

export function PendingLinkPage() {
  const { loading, session, profile, refreshProfile, signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Tenta puxar novamente o profile (caso um gestor tenha vinculado org/role)
    if (!loading && session) refreshProfile()
  }, [loading, session, refreshProfile])

  if (!loading && !session) return <Navigate to="/login" replace />
  if (!loading && profile?.org_id) return <Navigate to="/dashboard" replace />

  async function onRefresh() {
    setBusy(true)
    try {
      await refreshProfile()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Acesso pendente</h2>
        <p className="muted" style={{ marginTop: -6 }}>
          Sua conta foi criada, mas ainda não está vinculada a uma organização e perfil (Gestor/Analista/Cliente).
          Peça ao Gestor para vincular seu usuário na tabela <code>profiles</code> (campos <code>org_id</code>,{' '}
          <code>role</code> e, se for Cliente, <code>client_id</code>).
        </p>

        <div className="row" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={onRefresh}>
            {busy ? 'Atualizando...' : 'Já fui vinculado (atualizar)'}
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  )
}


