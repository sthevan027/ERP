import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { listProducts, markProductInStock, markProductReceived } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import type { Product } from '../../lib/types'
import { statusLabel } from '../../lib/format'
import { TruckIcon, PackageIcon, CheckCircleIcon, AlertCircleIcon } from '../../components/icons'

function ProductCard({
  product,
  actionLabel,
  actionColor,
  onAction,
  acting,
}: {
  product: Product
  actionLabel: string
  actionColor: 'primary' | 'success'
  onAction: () => void
  acting: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{product.sku}</span>
        <span
          className={`badge ${
            product.status === 'in_stock'
              ? 'badge-success'
              : product.status === 'received'
                ? 'badge-primary'
                : 'badge-warning'
          }`}
        >
          {statusLabel(product.status)}
        </span>
      </div>

      {product.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          {product.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>{Number(product.metric_qty).toFixed(2)}</strong> unid.
        </span>
        {product.expected_arrival_date && (
          <span>
            Previsto: <strong style={{ color: 'var(--text-secondary)' }}>{product.expected_arrival_date}</strong>
          </span>
        )}
        {product.received_at && (
          <span>
            Recebido: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(product.received_at).toLocaleDateString()}</strong>
          </span>
        )}
      </div>

      <Button
        variant={actionColor === 'success' ? 'success' : 'primary'}
        size="sm"
        onClick={onAction}
        loading={acting}
        style={{ marginTop: 'var(--space-xs)', alignSelf: 'flex-start' }}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Recebimentos</h1>
        <p className="page-subtitle">
          Gerencie o fluxo de recebimento de produtos
        </p>
      </div>

      {/* Workflow Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fluxo:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span className="badge badge-warning">
            <TruckIcon size={14} />
            A Caminho
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span className="badge badge-primary">
            <PackageIcon size={14} />
            Recebido
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span className="badge badge-success">
            <CheckCircleIcon size={14} />
            Em Estoque
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircleIcon size={20} />
          <div>
            <strong>Erro</strong>
            <p style={{ margin: 0, marginTop: 4, opacity: 0.9 }}>{error}</p>
          </div>
        </div>
      )}

      {busy ? (
        <div className="loading-overlay" style={{ minHeight: 300 }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="grid grid-2">
          {/* Incoming */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--warning-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warning)',
                  }}
                >
                  <TruckIcon size={18} />
                </div>
                <div>
                  <h3 className="card-title">A Caminho</h3>
                  <p className="card-subtitle">{incoming.length} produto(s)</p>
                </div>
              </div>
            </div>

            {incoming.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <TruckIcon size={40} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
                <div className="empty-state-title">Nenhum produto a caminho</div>
                <div className="empty-state-text">
                  Produtos com status "A Caminho" aparecerão aqui.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {incoming.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    actionLabel="Registrar Chegada"
                    actionColor="primary"
                    onAction={() => doReceive(p.id)}
                    acting={actingId === p.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Received */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <PackageIcon size={18} />
                </div>
                <div>
                  <h3 className="card-title">Recebidos</h3>
                  <p className="card-subtitle">{received.length} aguardando estoque</p>
                </div>
              </div>
            </div>

            {received.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <PackageIcon size={40} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
                <div className="empty-state-title">Nenhum produto recebido</div>
                <div className="empty-state-text">
                  Produtos aguardando entrada no estoque aparecerão aqui.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {received.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    actionLabel="Marcar em Estoque"
                    actionColor="success"
                    onAction={() => doStock(p.id)}
                    acting={actingId === p.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
