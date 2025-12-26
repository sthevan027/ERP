import { supabase } from './supabaseClient'
import type { Client, Product, Profile, Warehouse } from './types'

async function requireUserId(): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Usuário não autenticado.')
  return userId
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, org_id, role, client_id, full_name')
    .eq('user_id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Profile
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, org_id, name, metric_unit, metric_label, capacity_total')
    .order('name')
  if (error) throw error
  return (data ?? []) as Warehouse[]
}

export async function updateWarehouseSettings(params: {
  warehouseId: string
  metric_unit: Warehouse['metric_unit']
  metric_label: string | null
  capacity_total: number
}): Promise<void> {
  const { error } = await supabase
    .from('warehouses')
    .update({
      metric_unit: params.metric_unit,
      metric_label: params.metric_label,
      capacity_total: params.capacity_total,
    })
    .eq('id', params.warehouseId)
  if (error) throw error
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('id, org_id, name').order('name')
  if (error) throw error
  return (data ?? []) as Client[]
}

export async function listProducts(filters?: { status?: Product['status'] | 'all' }): Promise<Product[]> {
  let q = supabase
    .from('products')
    .select(
      'id, org_id, client_id, warehouse_id, sku, description, status, expected_arrival_date, received_at, in_stock_at, metric_qty, location_id, created_at',
    )
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function createProduct(params: {
  org_id: string
  client_id: string
  warehouse_id: string
  sku: string
  description?: string | null
  expected_arrival_date?: string | null
  metric_qty: number
}): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase.from('products').insert({
    org_id: params.org_id,
    client_id: params.client_id,
    warehouse_id: params.warehouse_id,
    sku: params.sku,
    description: params.description ?? null,
    expected_arrival_date: params.expected_arrival_date ?? null,
    metric_qty: params.metric_qty,
    created_by: userId,
    updated_by: userId,
  })
  if (error) throw error
}

export async function markProductReceived(params: { productId: string }): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase
    .from('products')
    .update({
      status: 'received',
      received_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', params.productId)
  if (error) throw error
}

export async function markProductInStock(params: { productId: string; location_id?: string | null }): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase
    .from('products')
    .update({
      status: 'in_stock',
      in_stock_at: new Date().toISOString(),
      location_id: params.location_id ?? null,
      updated_by: userId,
    })
    .eq('id', params.productId)
  if (error) throw error
}


