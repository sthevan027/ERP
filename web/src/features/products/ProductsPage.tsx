import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { createProduct, listClients, listProducts, listWarehouses } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import { statusBadgeClass, statusLabel } from '../../lib/format'
import type { Client, Product, Warehouse } from '../../lib/types'
import { useAuth } from '../../app/hooks/useAuth'

export function ProductsPage() {
  const { role, orgId } = useAuth()
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const canCreate = role === 'manager' || role === 'analyst'

  const [newSku, setNewSku] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newClientId, setNewClientId] = useState('')
  const [newWarehouseId, setNewWarehouseId] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [creating, setCreating] = useState(false)

  async function reload() {
    setBusy(true)
    setError(null)
    try {
      const [p, w, c] = await Promise.all([listProducts({ status: 'all' }), listWarehouses(), listClients()])
      setProducts(p)
      setWarehouses(w)
      setClients(c)
      setNewWarehouseId((prev) => prev || w[0]?.id || '')
      setNewClientId((prev) => prev || c[0]?.id || '')
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao carregar produtos'))
    }
    setBusy(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const metricLabel = useMemo(() => {
    const wh = warehouses.find((x) => x.id === newWarehouseId) ?? warehouses[0]
    if (!wh) return 'unidade'
    return wh.metric_label ?? wh.metric_unit
  }, [warehouses, newWarehouseId])

  async function onCreate() {
    if (!orgId) {
      setError('Usuário não vinculado a uma organização.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await createProduct({
        org_id: orgId,
        client_id: newClientId,
        warehouse_id: newWarehouseId,
        sku: newSku.trim(),
        description: newDesc.trim() ? newDesc.trim() : null,
        expected_arrival_date: newExpected ? newExpected : null,
        metric_qty: Number(newQty || 0),
      })
      setNewSku('')
      setNewDesc('')
      setNewQty('1')
      setNewExpected('')
      await reload()
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao criar produto'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <h2 style={{ margin: 0 }}>Produtos</h2>
        <div className="muted" style={{ marginTop: 6 }}>
          {canCreate ? 'Cadastro e consulta.' : 'Consulta restrita aos seus produtos.'}
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

      {canCreate && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Novo produto</h3>

          <div className="row">
            <div style={{ flex: '1 1 220px' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Cliente
              </div>
              <Select value={newClientId} onChange={(e) => setNewClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ flex: '1 1 220px' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Galpão
              </div>
              <Select value={newWarehouseId} onChange={(e) => setNewWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div style={{ flex: '1 1 160px' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                SKU
              </div>
              <Input value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="SKU-123" />
            </div>
            <div style={{ flex: '2 1 280px' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Descrição
              </div>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div style={{ flex: '1 1 160px' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Quantidade ({metricLabel})
              </div>
              <Input value={newQty} onChange={(e) => setNewQty(e.target.value)} inputMode="decimal" />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Previsão de chegada
              </div>
              <Input value={newExpected} onChange={(e) => setNewExpected(e.target.value)} type="date" />
            </div>
            <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'flex-end' }}>
              <Button disabled={creating || !newSku.trim() || !newClientId || !newWarehouseId} onClick={onCreate}>
                {creating ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Lista</h3>
        {busy ? (
          <div className="muted">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="muted">Nenhum produto encontrado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.slice(0, 50).map((p) => (
              <div key={p.id} className="card" style={{ padding: 12 }}>
                <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <strong>{p.sku}</strong>
                    {p.description && <span className="muted">{p.description}</span>}
                  </div>
                  <span className={`badge ${statusBadgeClass(p.status)}`}>{statusLabel(p.status)}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Quantidade: <strong>{Number(p.metric_qty).toFixed(2)}</strong> · Criado em:{' '}
                  {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {products.length > 50 && <div className="muted">Mostrando 50 de {products.length} (MVP).</div>}
          </div>
        )}
      </div>
    </div>
  )
}


