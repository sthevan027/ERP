import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../app/hooks/useAuth'
import { listProducts, listWarehouses } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import type { Product, Warehouse } from '../../lib/types'
import { statusLabel } from '../../lib/format'
import { PackageIcon, TruckIcon, CheckCircleIcon, AlertCircleIcon, BarChartIcon } from '../../components/icons'

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const colors = {
    primary: { bg: 'var(--primary-bg)', border: 'var(--primary-border)', icon: 'var(--primary)' },
    success: { bg: 'var(--success-bg)', border: 'var(--success-border)', icon: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)', border: 'var(--warning-border)', icon: 'var(--warning)' },
    danger: { bg: 'var(--danger-bg)', border: 'var(--danger-border)', icon: 'var(--danger)' },
  }

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{value}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: colors[color].bg,
            border: `1px solid ${colors[color].border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors[color].icon,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { role, profile } = useAuth()
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

  const roleLabels: Record<string, string> = {
    manager: 'Gestor',
    analyst: 'Analista',
    client: 'Cliente',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Bem-vindo, <strong>{profile?.full_name ?? 'Usuário'}</strong> · {roleLabels[role ?? ''] ?? role}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircleIcon size={20} />
          <div>
            <strong>Erro ao carregar dados</strong>
            <p style={{ margin: 0, marginTop: 4, opacity: 0.9 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-3">
        <StatCard
          title="A Caminho"
          value={busy ? '—' : byStatus.in_transit}
          subtitle={`${statusLabel('in_transit')}`}
          icon={<TruckIcon size={24} />}
          color="warning"
        />
        <StatCard
          title="Recebidos"
          value={busy ? '—' : byStatus.received}
          subtitle={`${statusLabel('received')}`}
          icon={<PackageIcon size={24} />}
          color="primary"
        />
        <StatCard
          title="Em Estoque"
          value={busy ? '—' : byStatus.in_stock}
          subtitle={`${statusLabel('in_stock')}`}
          icon={<CheckCircleIcon size={24} />}
          color="success"
        />
      </div>

      {/* Occupancy Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Ocupação do Galpão</h3>
            <p className="card-subtitle">Capacidade utilizada vs. total</p>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <BarChartIcon size={20} />
          </div>
        </div>

        {busy ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        ) : !occupancy ? (
          <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
            <div className="empty-state-title">Nenhum galpão configurado</div>
            <div className="empty-state-text">
              Configure um galpão para visualizar a ocupação.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{occupancy.wh.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {occupancy.wh.metric_label ?? occupancy.wh.metric_unit}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {occupancy.pct !== null ? `${occupancy.pct.toFixed(1)}%` : '—'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {occupancy.used.toFixed(0)} / {occupancy.total.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="progress-bar" style={{ height: 12 }}>
              <div
                className="progress-fill"
                style={{
                  width: occupancy.pct === null ? '0%' : `${occupancy.pct}%`,
                  background:
                    occupancy.pct !== null && occupancy.pct > 90
                      ? 'var(--danger)'
                      : occupancy.pct !== null && occupancy.pct > 70
                        ? 'var(--warning)'
                        : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recent Products */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Produtos Recentes</h3>
            <p className="card-subtitle">Últimos produtos cadastrados</p>
          </div>
        </div>

        {busy ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
            <PackageIcon size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <div className="empty-state-title">Nenhum produto encontrado</div>
            <div className="empty-state-text">
              Comece cadastrando um novo produto.
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.sku}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.description ?? '—'}</td>
                    <td>{Number(p.metric_qty).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === 'in_stock'
                            ? 'badge-success'
                            : p.status === 'received'
                              ? 'badge-primary'
                              : 'badge-warning'
                        }`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
