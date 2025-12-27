import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { createProduct, listClients, listProducts, listWarehouses } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import { statusLabel } from '../../lib/format'
import type { Client, Product, Warehouse } from '../../lib/types'
import { useAuth } from '../../app/hooks/useAuth'
import { PackageIcon, PlusIcon, AlertCircleIcon, SearchIcon } from '../../components/icons'

export function ProductsPage() {
  const { role, orgId } = useAuth()
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const canCreate = role === 'manager' || role === 'analyst'

  const [showForm, setShowForm] = useState(false)
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [products, search, statusFilter])

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
      setShowForm(false)
      await reload()
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao criar produto'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">
            {canCreate ? 'Gerencie o cadastro de produtos' : 'Consulte seus produtos'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(!showForm)} icon={<PlusIcon size={18} />}>
            Novo Produto
          </Button>
        )}
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

      {/* Create Form */}
      {showForm && canCreate && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Novo Produto</h3>
              <p className="card-subtitle">Preencha os dados do produto</p>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Cliente
              </label>
              <Select value={newClientId} onChange={(e) => setNewClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Galpão
              </label>
              <Select value={newWarehouseId} onChange={(e) => setNewWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                SKU
              </label>
              <Input value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="SKU-001" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Descrição
              </label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição do produto (opcional)" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Quantidade ({metricLabel})
              </label>
              <Input value={newQty} onChange={(e) => setNewQty(e.target.value)} type="number" inputMode="decimal" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Previsão de Chegada
              </label>
              <Input value={newExpected} onChange={(e) => setNewExpected(e.target.value)} type="date" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={onCreate}
              loading={creating}
              disabled={!newSku.trim() || !newClientId || !newWarehouseId}
            >
              Cadastrar Produto
            </Button>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Lista de Produtos</h3>
            <p className="card-subtitle">{filteredProducts.length} produto(s) encontrado(s)</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por SKU ou descrição..."
              icon={<SearchIcon size={18} />}
            />
          </div>
          <div style={{ width: 180 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos os Status</option>
              <option value="in_transit">A Caminho</option>
              <option value="received">Recebido</option>
              <option value="in_stock">Em Estoque</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        {busy ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <PackageIcon size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <div className="empty-state-title">Nenhum produto encontrado</div>
            <div className="empty-state-text">
              {search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece cadastrando um novo produto.'}
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
                  <th>Previsão</th>
                  <th>Status</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, 50).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.sku}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.description ?? '—'}</td>
                    <td>{Number(p.metric_qty).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {p.expected_arrival_date ?? '—'}
                    </td>
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
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredProducts.length > 50 && (
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Mostrando 50 de {filteredProducts.length} produtos
          </div>
        )}
      </div>
    </div>
  )
}
