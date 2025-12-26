import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { listWarehouses, updateWarehouseSettings } from '../../lib/db'
import { errorMessage } from '../../lib/errors'
import type { Warehouse } from '../../lib/types'

const metricUnits = ['m2', 'pallet', 'box', 'position', 'custom'] as const
type MetricUnit = (typeof metricUnits)[number]

export function WarehouseSettingsPage() {
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    try {
      await updateWarehouseSettings({
        warehouseId: selected.id,
        metric_unit: metricUnit,
        metric_label: metricLabel.trim() ? metricLabel.trim() : null,
        capacity_total: Number(capacityTotal || 0),
      })
      const w = await listWarehouses()
      setWarehouses(w)
    } catch (e: unknown) {
      setError(errorMessage(e, 'Falha ao salvar'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <h2 style={{ margin: 0 }}>Configuração do Galpão</h2>
        <div className="muted" style={{ marginTop: 6 }}>
          O Gestor define a métrica (m²/pallet/caixas/posições/custom) e a capacidade total.
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Galpão</h3>
        {busy ? (
          <div className="muted">Carregando...</div>
        ) : warehouses.length === 0 ? (
          <div className="muted">
            Nenhum galpão encontrado. Crie uma linha em <code>warehouses</code> via SQL Editor (MVP) usando o Service Role
            ou manualmente.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Selecionar
              </div>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="row">
              <div style={{ flex: '1 1 220px' }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Unidade
                </div>
                <Select
                  value={metricUnit}
                  onChange={(e) => {
                    const v = e.target.value
                    if (metricUnits.includes(v as MetricUnit)) setMetricUnit(v as Warehouse['metric_unit'])
                  }}
                >
                  <option value="m2">m²</option>
                  <option value="pallet">Pallet</option>
                  <option value="box">Caixa</option>
                  <option value="position">Posição</option>
                  <option value="custom">Custom</option>
                </Select>
              </div>

              <div style={{ flex: '1 1 220px' }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Label (opcional)
                </div>
                <Input value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} placeholder="ex: m²" />
              </div>
            </div>

            <div className="row">
              <div style={{ flex: '1 1 220px' }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Capacidade total
                </div>
                <Input value={capacityTotal} onChange={(e) => setCapacityTotal(e.target.value)} inputMode="decimal" />
              </div>
              <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'flex-end' }}>
                <Button disabled={saving || !selected} onClick={onSave}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


