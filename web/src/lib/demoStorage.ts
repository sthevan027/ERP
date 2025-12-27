/**
 * Sistema de armazenamento local para demonstração
 * Simula o banco de dados usando localStorage
 */

import type { Client, Product, Profile, Warehouse } from './types'

const STORAGE_KEYS = {
  USERS: 'demo_users',
  PROFILES: 'demo_profiles',
  ORGS: 'demo_orgs',
  WAREHOUSES: 'demo_warehouses',
  CLIENTS: 'demo_clients',
  PRODUCTS: 'demo_products',
  SESSION: 'demo_session',
} as const

// Tipos para armazenamento
type StoredUser = {
  id: string
  email: string
  password: string // Em produção, nunca armazenar senha assim!
  email_confirmed: boolean
  created_at: string
}

type StoredSession = {
  user: { id: string; email: string }
  access_token: string
  expires_at: number
} | null

// Funções auxiliares
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error)
  }
}

// Inicialização com dados de demonstração
function initDemoData() {
  // Verifica se já foi inicializado e se os dados existem
  const existingUsers = getStorage<StoredUser[]>(STORAGE_KEYS.USERS, [])
  if (localStorage.getItem('demo_initialized') && existingUsers.length > 0) {
    return
  }

  const now = new Date().toISOString()
  const orgId = 'demo-org-1'
  const warehouseId = 'demo-warehouse-1'
  const clientId = 'demo-client-1'

  // Usuários de demonstração
  const users: StoredUser[] = [
    {
      id: 'demo-user-manager',
      email: 'gestor@demo.com',
      password: 'Gestor123!',
      email_confirmed: true,
      created_at: now,
    },
    {
      id: 'demo-user-analyst',
      email: 'analista@demo.com',
      password: 'Analista123!',
      email_confirmed: true,
      created_at: now,
    },
    {
      id: 'demo-user-client',
      email: 'cliente@demo.com',
      password: 'Cliente123!',
      email_confirmed: true,
      created_at: now,
    },
  ]

  // Perfis
  const profiles: Profile[] = [
    {
      user_id: 'demo-user-manager',
      org_id: orgId,
      role: 'manager',
      client_id: null,
      full_name: 'Gestor Demo',
    },
    {
      user_id: 'demo-user-analyst',
      org_id: orgId,
      role: 'analyst',
      client_id: null,
      full_name: 'Analista Demo',
    },
    {
      user_id: 'demo-user-client',
      org_id: orgId,
      role: 'client',
      client_id: clientId,
      full_name: 'Cliente Demo',
    },
  ]

  // Organização
  const orgs = [
    {
      id: orgId,
      name: 'Empresa Demo',
      created_at: now,
    },
  ]

  // Galpão
  const warehouses: Warehouse[] = [
    {
      id: warehouseId,
      org_id: orgId,
      name: 'Galpão Principal',
      metric_unit: 'pallet',
      metric_label: 'Pallets',
      capacity_total: 1000,
    },
  ]

  // Cliente
  const clients: Client[] = [
    {
      id: clientId,
      org_id: orgId,
      name: 'Cliente Demo',
    },
  ]

  // Produtos de exemplo
  const products: Product[] = [
    {
      id: 'demo-product-1',
      org_id: orgId,
      client_id: clientId,
      warehouse_id: warehouseId,
      sku: 'PROD-001',
      description: 'Produto de Demonstração 1',
      status: 'in_transit',
      expected_arrival_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      received_at: null,
      in_stock_at: null,
      metric_qty: 10,
      location_id: null,
      created_at: now,
    },
    {
      id: 'demo-product-2',
      org_id: orgId,
      client_id: clientId,
      warehouse_id: warehouseId,
      sku: 'PROD-002',
      description: 'Produto de Demonstração 2',
      status: 'received',
      expected_arrival_date: null,
      received_at: new Date().toISOString(),
      in_stock_at: null,
      metric_qty: 5,
      location_id: null,
      created_at: now,
    },
    {
      id: 'demo-product-3',
      org_id: orgId,
      client_id: clientId,
      warehouse_id: warehouseId,
      sku: 'PROD-003',
      description: 'Produto de Demonstração 3',
      status: 'in_stock',
      expected_arrival_date: null,
      received_at: new Date().toISOString(),
      in_stock_at: new Date().toISOString(),
      metric_qty: 20,
      location_id: null,
      created_at: now,
    },
  ]

  setStorage(STORAGE_KEYS.USERS, users)
  setStorage(STORAGE_KEYS.PROFILES, profiles)
  setStorage(STORAGE_KEYS.ORGS, orgs)
  setStorage(STORAGE_KEYS.WAREHOUSES, warehouses)
  setStorage(STORAGE_KEYS.CLIENTS, clients)
  setStorage(STORAGE_KEYS.PRODUCTS, products)
  localStorage.setItem('demo_initialized', 'true')
}

// Inicializa dados de demo na primeira carga
initDemoData()

// ===== AUTH =====
export const demoAuth = {
  async signInWithPassword(params: { email: string; password: string } | string, password?: string) {
    // Suporta tanto { email, password } quanto (email, password)
    let email: string
    let pwd: string
    
    if (typeof params === 'string') {
      email = params
      pwd = password!
    } else {
      email = params.email
      pwd = params.password
    }
    
    // Garante que email é string e faz trim
    if (typeof email !== 'string') {
      return { 
        data: { session: null, user: null }, 
        error: { message: 'E-mail inválido.', status: 400 } 
      }
    }
    
    email = email.trim()
    
    const users = getStorage<StoredUser[]>(STORAGE_KEYS.USERS, [])
    
    // Se não houver usuários, reinicializa os dados
    if (users.length === 0) {
      localStorage.removeItem('demo_initialized')
      initDemoData()
      // Recarrega os usuários após reinicializar
      const refreshedUsers = getStorage<StoredUser[]>(STORAGE_KEYS.USERS, [])
      if (refreshedUsers.length === 0) {
        throw new Error('Erro ao inicializar dados de demonstração. Recarregue a página.')
      }
    }
    
    // Normaliza email (trim e lowercase) para comparação
    const normalizedEmail = email.trim().toLowerCase()
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === pwd)

    if (!user) {
      console.error('Login falhou:', { email: normalizedEmail, usersCount: users.length, users: users.map(u => u.email) })
      return { 
        data: { session: null, user: null }, 
        error: { message: 'E-mail ou senha incorretos.', status: 400 } 
      }
    }

    if (!user.email_confirmed) {
      return { 
        data: { session: null, user: null }, 
        error: { message: 'E-mail não confirmado.', status: 400 } 
      }
    }

    const session: StoredSession = {
      user: { id: user.id, email: user.email },
      access_token: `demo_token_${user.id}_${Date.now()}`,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
    }

    setStorage(STORAGE_KEYS.SESSION, session)
    return { data: { session, user: session.user }, error: null }
  },

  async signOut() {
    setStorage(STORAGE_KEYS.SESSION, null)
    return { error: null }
  },

  async getSession() {
    const session = getStorage<StoredSession>(STORAGE_KEYS.SESSION, null)
    if (!session || session.expires_at < Date.now()) {
      setStorage(STORAGE_KEYS.SESSION, null)
      return { data: { session: null }, error: null }
    }
    return { data: { session }, error: null }
  },

  async getUser() {
    const session = getStorage<StoredSession>(STORAGE_KEYS.SESSION, null)
    if (!session || session.expires_at < Date.now()) {
      return { data: { user: null }, error: null }
    }
    return { data: { user: session.user }, error: null }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Simula mudanças de auth state
    const checkSession = () => {
      const session = getStorage<StoredSession>(STORAGE_KEYS.SESSION, null)
      callback('SIGNED_IN', session)
    }

    checkSession()
    const interval = setInterval(checkSession, 1000)

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval),
        },
      },
    }
  },
}

// ===== PROFILES =====
export const demoProfiles = {
  async get(userId: string): Promise<Profile | null> {
    const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, [])
    return profiles.find(p => p.user_id === userId) || null
  },

  async list(): Promise<Profile[]> {
    return getStorage<Profile[]>(STORAGE_KEYS.PROFILES, [])
  },
}

// ===== WAREHOUSES =====
export const demoWarehouses = {
  async list(orgId: string): Promise<Warehouse[]> {
    const warehouses = getStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, [])
    return warehouses.filter(w => w.org_id === orgId)
  },

  async update(id: string, data: Partial<Warehouse>): Promise<void> {
    const warehouses = getStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, [])
    const index = warehouses.findIndex(w => w.id === id)
    if (index >= 0) {
      warehouses[index] = { ...warehouses[index], ...data }
      setStorage(STORAGE_KEYS.WAREHOUSES, warehouses)
    }
  },
}

// ===== CLIENTS =====
export const demoClients = {
  async list(orgId: string): Promise<Client[]> {
    const clients = getStorage<Client[]>(STORAGE_KEYS.CLIENTS, [])
    return clients.filter(c => c.org_id === orgId)
  },
}

// ===== PRODUCTS =====
export const demoProducts = {
  async list(orgId: string, filters?: { status?: string }): Promise<Product[]> {
    let products = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
    products = products.filter(p => p.org_id === orgId)

    if (filters?.status && filters.status !== 'all') {
      products = products.filter(p => p.status === filters.status)
    }

    return products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async create(product: Omit<Product, 'id' | 'created_at'>): Promise<void> {
    const products = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
    const newProduct: Product = {
      ...product,
      id: `demo-product-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    products.push(newProduct)
    setStorage(STORAGE_KEYS.PRODUCTS, products)
  },

  async update(id: string, data: Partial<Product>): Promise<void> {
    const products = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
    const index = products.findIndex(p => p.id === id)
    if (index >= 0) {
      products[index] = { ...products[index], ...data }
      setStorage(STORAGE_KEYS.PRODUCTS, products)
    }
  },
}

// Função para limpar todos os dados (útil para reset)
export function clearDemoData() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  localStorage.removeItem('demo_initialized')
  initDemoData()
}

