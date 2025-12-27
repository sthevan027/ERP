import { supabase, USE_DEMO } from './supabaseClient'
import type { Client, Product, Profile, Warehouse } from './types'
import { queryWithRetry, mutation, translateDbError } from './dbClient'
import { demoProfiles, demoWarehouses, demoClients, demoProducts } from './demoStorage'

async function requireUserId(): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Usuário não autenticado.')
  return userId
}

async function getCurrentOrgId(): Promise<string> {
  const profile = await getProfile()
  if (!profile?.org_id) throw new Error('Usuário não vinculado a uma organização.')
  return profile.org_id
}

export async function getProfile(): Promise<Profile | null> {
  if (USE_DEMO) {
    const userId = await requireUserId()
    return await demoProfiles.get(userId)
  }

  try {
    const userId = await requireUserId()
    const data = await queryWithRetry<Profile>(() =>
      supabase
        .from('profiles')
        .select('user_id, org_id, role, client_id, full_name')
        .eq('user_id', userId)
        .single(),
    )
    return data
  } catch (error: unknown) {
    // Se não encontrou o perfil, retorna null (usuário ainda não vinculado)
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'PGRST116') {
      return null
    }
    // Outros erros são lançados com mensagem traduzida
    throw new Error(translateDbError(error))
  }
}

export async function listWarehouses(): Promise<Warehouse[]> {
  if (USE_DEMO) {
    const orgId = await getCurrentOrgId()
    return await demoWarehouses.list(orgId)
  }

  try {
    const data = await queryWithRetry<Warehouse[]>(() =>
      supabase
        .from('warehouses')
        .select('id, org_id, name, metric_unit, metric_label, capacity_total')
        .order('name'),
    )
    return data ?? []
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
}

export async function updateWarehouseSettings(params: {
  warehouseId: string
  metric_unit: Warehouse['metric_unit']
  metric_label: string | null
  capacity_total: number
}): Promise<void> {
  if (USE_DEMO) {
    await demoWarehouses.update(params.warehouseId, {
      metric_unit: params.metric_unit,
      metric_label: params.metric_label,
      capacity_total: params.capacity_total,
    })
    return
  }

  try {
    await mutation(() =>
      supabase
        .from('warehouses')
        .update({
          metric_unit: params.metric_unit,
          metric_label: params.metric_label,
          capacity_total: params.capacity_total,
        })
        .eq('id', params.warehouseId),
    )
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
}

export async function listClients(): Promise<Client[]> {
  if (USE_DEMO) {
    const orgId = await getCurrentOrgId()
    return await demoClients.list(orgId)
  }

  try {
    const data = await queryWithRetry<Client[]>(() =>
      supabase.from('clients').select('id, org_id, name').order('name'),
    )
    return data ?? []
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
}

export async function listProducts(filters?: { status?: Product['status'] | 'all' }): Promise<Product[]> {
  if (USE_DEMO) {
    const orgId = await getCurrentOrgId()
    return await demoProducts.list(orgId, filters)
  }

  try {
    let query = supabase
      .from('products')
      .select(
        'id, org_id, client_id, warehouse_id, sku, description, status, expected_arrival_date, received_at, in_stock_at, metric_qty, location_id, created_at',
      )
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const data = await queryWithRetry<Product[]>(() => query)
    return data ?? []
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
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
  if (USE_DEMO) {
    await demoProducts.create({
      org_id: params.org_id,
      client_id: params.client_id,
      warehouse_id: params.warehouse_id,
      sku: params.sku,
      description: params.description ?? null,
      status: 'in_transit',
      expected_arrival_date: params.expected_arrival_date ?? null,
      received_at: null,
      in_stock_at: null,
      metric_qty: params.metric_qty,
      location_id: null,
    })
    return
  }

  try {
    const userId = await requireUserId()
    await mutation(() =>
      supabase.from('products').insert({
        org_id: params.org_id,
        client_id: params.client_id,
        warehouse_id: params.warehouse_id,
        sku: params.sku,
        description: params.description ?? null,
        expected_arrival_date: params.expected_arrival_date ?? null,
        metric_qty: params.metric_qty,
        created_by: userId,
        updated_by: userId,
      }),
    )
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
}

export async function markProductReceived(params: { productId: string }): Promise<void> {
  if (USE_DEMO) {
    await demoProducts.update(params.productId, {
      status: 'received',
      received_at: new Date().toISOString(),
    })
    return
  }

  try {
    const userId = await requireUserId()
    await mutation(() =>
      supabase
        .from('products')
        .update({
          status: 'received',
          received_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', params.productId),
    )
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
}

export async function markProductInStock(params: { productId: string; location_id?: string | null }): Promise<void> {
  if (USE_DEMO) {
    await demoProducts.update(params.productId, {
      status: 'in_stock',
      in_stock_at: new Date().toISOString(),
      location_id: params.location_id ?? null,
    })
    return
  }

  try {
    const userId = await requireUserId()
    await mutation(() =>
      supabase
        .from('products')
        .update({
          status: 'in_stock',
          in_stock_at: new Date().toISOString(),
          location_id: params.location_id ?? null,
          updated_by: userId,
        })
        .eq('id', params.productId),
    )
  } catch (error: unknown) {
    throw new Error(translateDbError(error))
  }
}


