export type UserRole = 'unassigned' | 'manager' | 'analyst' | 'client'

export type ProductStatus = 'in_transit' | 'received' | 'in_stock'

export type Profile = {
  user_id: string
  org_id: string | null
  role: UserRole
  client_id: string | null
  full_name: string | null
}

export type Warehouse = {
  id: string
  org_id: string
  name: string
  metric_unit: 'm2' | 'pallet' | 'box' | 'position' | 'custom'
  metric_label: string | null
  capacity_total: number
}

export type Client = {
  id: string
  org_id: string
  name: string
}

export type Product = {
  id: string
  org_id: string
  client_id: string
  warehouse_id: string
  sku: string
  description: string | null
  status: ProductStatus
  expected_arrival_date: string | null
  received_at: string | null
  in_stock_at: string | null
  metric_qty: number
  location_id: string | null
  created_at: string
}


