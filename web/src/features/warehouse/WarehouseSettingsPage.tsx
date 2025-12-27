import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { listWarehouses, updateWarehouseSettings } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import type { Warehouse } from '../../lib/types'
import { SettingsIcon, AlertCircleIcon, CheckCircleIcon, WarehouseIcon } from '../../components/icons'

const metricUnits = ['m2', 'pallet', 'box', 'position', 'custom'] as const
type MetricUnit = (typeof metricUnits)[number]

const metricLabelsMap: Record<MetricUnit, string> = {
  m2: 'Metros Quadrados (m²)',
  pallet: 'Pallets',
  box: 'Caixas',
  position: 'Posições',
  custom: 'Personalizado',
}

export function WarehouseSettingsPage() {
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [warehouseId, setWarehouseId] = useState('')
  const selected = useMemo(() => warehouses.find((w) => w.id === warehouseId) ?? null, [warehouses, warehouseId])

  const [metricUnit, setMetricUnit] = useState<Warehouse['metric_unit']>('pallet')
  const [metricLabel, setMetricLabel] = useState<string>('')
  const [capacityTotal, setCapacityTotal] = useState<string>('0')

  useEffect(() => {
    let alive = true
    async function load() {
      setBusy(true)
      setError(null)
      try {
        const w = await listWarehouses()
        if (!alive) return
        setWarehouses(w)
        const id = w[0]?.id ?? ''
        setWarehouseId(id)
      } catch (e: unknown) {
        if (!alive) return
        setError(errorMessage(e, 'Falha ao carregar galpões'))
      }
      if (!alive) return
      setBusy(false)
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!selected) return
    setMetricUnit(selected.metric_unit)
    setMetricLabel(selected.metric_label ?? '')
    setCapacityTotal(String(selected.capacity_total ?? 0))
  }, [selected])

  async function onSave() {
    if (!selected) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await updateWarehouseSettings({
        warehouseId: selected.id,
        metric_unit: metricUnit,
        metric_label: metricLabel.trim() ? metricLabel.trim() : null,
        capacity_total: Number(capacityTotal || 0),
      })
      const w = await listWarehouses()
      setWarehouses(w)
      setSuccess('Configurações salvas com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao salvar'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Configuração do Galpão</h1>
        <p className="page-subtitle">
          Configure as métricas e capacidade do galpão
        </p>
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

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success">
          <CheckCircleIcon size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Settings Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
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
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="card-title">Configurações</h3>
              <p className="card-subtitle">Defina a métrica e capacidade</p>
            </div>
          </div>
        </div>

        {busy ? (
          <div className="loading-overlay" style={{ minHeight: 200 }}>
            <div className="loading-spinner" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
            <WarehouseIcon size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <div className="empty-state-title">Nenhum galpão encontrado</div>
            <div className="empty-state-text">
              É necessário criar um galpão no banco de dados para configurar.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Warehouse Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Selecionar Galpão
              </label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="divider" />

            {/* Metric Settings */}
            <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Unidade de Medida
                </label>
                <Select
                  value={metricUnit}
                  onChange={(e) => {
                    const v = e.target.value
                    if (metricUnits.includes(v as MetricUnit)) setMetricUnit(v as Warehouse['metric_unit'])
                  }}
                >
                  {metricUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {metricLabelsMap[unit]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Label Personalizado
                </label>
                <Input
                  value={metricLabel}
                  onChange={(e) => setMetricLabel(e.target.value)}
                  placeholder="Ex: m², pallets, caixas..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Capacidade Total
                </label>
                <Input
                  value={capacityTotal}
                  onChange={(e) => setCapacityTotal(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Current Preview */}
            {selected && (
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Preview
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {capacityTotal || '0'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {metricLabel || metricLabelsMap[metricUnit] || metricUnit}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <Button
                onClick={onSave}
                loading={saving}
                disabled={!selected}
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
