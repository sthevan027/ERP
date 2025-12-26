import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { listProducts, markProductInStock, markProductReceived } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import type { Product } from '../../lib/types'
import { statusBadgeClass, statusLabel } from '../../lib/format'

export function ReceiveProductPage() {
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [actingId, setActingId] = useState<string | null>(null)

  async function reload() {
    setBusy(true)
    setError(null)
    try {
      const p = await listProducts({ status: 'all' })
      setProducts(p)
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao carregar recebimentos'))
    }
    setBusy(false)
  }

  useEffect(() => {
    reload()
  }, [])

  async function doReceive(productId: string) {
    setActingId(productId)
    setError(null)
    try {
      await markProductReceived({ productId })
      await reload()
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao registrar recebimento'))
    } finally {
      setActingId(null)
    }
  }

  async function doStock(productId: string) {
    setActingId(productId)
    setError(null)
    try {
      await markProductInStock({ productId })
      await reload()
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao marcar como em estoque'))
    } finally {
      setActingId(null)
    }
  }

  const incoming = products.filter((p) => p.status === 'in_transit')
  const received = products.filter((p) => p.status === 'received')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <h2 style={{ margin: 0 }}>Recebimentos</h2>
        <div className="muted" style={{ marginTop: 6 }}>
          Fluxo operacional (Analista): <span className="badge warn">A caminho</span> →{' '}
          <span className="badge primary">Recebido</span> → <span className="badge ok">Em estoque</span>
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

      {busy ? (
        <div className="card">
          <div className="muted">Carregando...</div>
        </div>
      ) : (
        <div className="row">
          <div className="card" style={{ flex: '1 1 420px' }}>
            <h3 style={{ marginTop: 0 }}>A caminho</h3>
            {incoming.length === 0 ? (
              <div className="muted">Nada pendente.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incoming.map((p) => (
                  <div key={p.id} className="card" style={{ padding: 12 }}>
                    <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong>{p.sku}</strong>
                      <span className={`badge ${statusBadgeClass(p.status)}`}>{statusLabel(p.status)}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                      Previsto: {p.expected_arrival_date ?? '—'} · Quantidade:{' '}
                      <strong>{Number(p.metric_qty).toFixed(2)}</strong>
                    </div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <Button disabled={actingId === p.id} onClick={() => doReceive(p.id)}>
                        {actingId === p.id ? 'Salvando...' : 'Registrar chegada'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ flex: '1 1 420px' }}>
            <h3 style={{ marginTop: 0 }}>Recebidos (aguardando estoque)</h3>
            {received.length === 0 ? (
              <div className="muted">Nada pendente.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {received.map((p) => (
                  <div key={p.id} className="card" style={{ padding: 12 }}>
                    <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong>{p.sku}</strong>
                      <span className={`badge ${statusBadgeClass(p.status)}`}>{statusLabel(p.status)}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                      Recebido em: {p.received_at ? new Date(p.received_at).toLocaleString() : '—'} · Quantidade:{' '}
                      <strong>{Number(p.metric_qty).toFixed(2)}</strong>
                    </div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <Button disabled={actingId === p.id} onClick={() => doStock(p.id)}>
                        {actingId === p.id ? 'Salvando...' : 'Marcar como em estoque'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


