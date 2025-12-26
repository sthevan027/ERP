import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../app/hooks/useAuth'
import { listProducts, listWarehouses } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import type { Product, Warehouse } from '../../lib/types'
import { statusBadgeClass, statusLabel } from '../../lib/format'

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="card" style={{ minWidth: 220, flex: '1 1 220px' }}>
      <div className="muted" style={{ fontSize: 12 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {subtitle && (
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { role } = useAuth()
  const [busy, setBusy] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setBusy(true)
      setError(null)
      try {
        const [p, w] = await Promise.all([listProducts({ status: 'all' }), listWarehouses()])
        if (!alive) return
        setProducts(p)
        setWarehouses(w)
      } catch (e: unknown) {
        if (!alive) return
        setError(errorMessage(e, 'Falha ao carregar dashboard'))
      }
      if (!alive) return
      setBusy(false)
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const byStatus = useMemo(() => {
    const out: Record<Product['status'], number> = { in_transit: 0, received: 0, in_stock: 0 }
    for (const p of products) out[p.status] += 1
    return out
  }, [products])

  const occupancy = useMemo(() => {
    const wh = warehouses[0]
    if (!wh) return null
    const used = products.filter((p) => p.status === 'in_stock').reduce((sum, p) => sum + (p.metric_qty ?? 0), 0)
    const total = wh.capacity_total ?? 0
    const pct = total > 0 ? Math.min(100, (used / total) * 100) : null
    return { wh, used, total, pct }
  }, [products, warehouses])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div className="muted" style={{ marginTop: 6 }}>
          Perfil atual: <span className="badge primary">{role ?? '—'}</span>
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

      <div className="row">
        <StatCard title="A caminho" value={busy ? '—' : String(byStatus.in_transit)} />
        <StatCard title="Recebidos" value={busy ? '—' : String(byStatus.received)} />
        <StatCard title="Em estoque" value={busy ? '—' : String(byStatus.in_stock)} />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ocupação</h3>
        {!occupancy ? (
          <div className="muted">Crie um galpão (warehouse) para começar a medir ocupação.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>{occupancy.wh.name}</strong>{' '}
                <span className="muted">
                  ({occupancy.wh.metric_label ?? occupancy.wh.metric_unit})
                </span>
              </div>
              <span className="badge">
                {occupancy.used.toFixed(2)} / {occupancy.total.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 12, borderRadius: 999, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: occupancy.pct === null ? '0%' : `${occupancy.pct}%`,
                  background: 'linear-gradient(90deg, rgba(59,130,246,0.9), rgba(29,78,216,0.9))',
                }}
              />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              *MVP*: soma <code>metric_qty</code> dos produtos <span className={`badge ${statusBadgeClass('in_stock')}`}>{statusLabel('in_stock')}</span>.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


