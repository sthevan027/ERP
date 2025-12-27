/**
 * Mock do Supabase Client para demonstração
 * Usa localStorage em vez de banco real
 */

import { demoAuth, demoProfiles, demoWarehouses, demoProducts } from './demoStorage'

// Flag para usar modo demo (pode ser controlado por env)
export const USE_DEMO_MODE = true // Mude para false para usar Supabase real

// Helper para criar query builder mock
function createQueryBuilder(table: string) {
  return {
    select: (_columns: string) => ({
      eq: (_column: string, value: any) => ({
        single: async () => {
          if (table === 'profiles' && _column === 'user_id') {
            const profile = await demoProfiles.get(value)
            return { data: profile, error: profile ? null : { code: 'PGRST116', message: 'Not found' } }
          }
          return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
        },
      }),
      order: (_column: string, _options?: { ascending?: boolean }) => ({
        then: async (_callback?: (result: any) => void) => {
          // Para warehouses, clients, products - usa as funções diretas
          if (table === 'warehouses') {
            // Precisa do org_id, mas vamos retornar vazio aqui e deixar o db.ts lidar
            return { data: [], error: null }
          }
          if (table === 'clients') {
            return { data: [], error: null }
          }
          if (table === 'products') {
            return { data: [], error: null }
          }
          return { data: [], error: null }
        },
      }),
    }),
    insert: (data: any) => ({
      select: (_columns: string) => ({
        single: async () => {
          if (table === 'products') {
            await demoProducts.create(data)
            return { data, error: null }
          }
          return { data, error: null }
        },
      }),
    }),
    update: (data: any) => ({
      eq: (_column: string, value: any) => ({
        then: async (_callback?: (result: any) => void) => {
          if (table === 'warehouses') {
            await demoWarehouses.update(value, data)
            return { data: null, error: null }
          }
          if (table === 'products') {
            await demoProducts.update(value, data)
            return { data: null, error: null }
          }
          return { data: null, error: null }
        },
      }),
    }),
  }
}

export const demoSupabase = {
  auth: {
    signInWithPassword: (params: { email: string; password: string }) => demoAuth.signInWithPassword(params),
    signOut: demoAuth.signOut,
    getSession: demoAuth.getSession,
    getUser: demoAuth.getUser,
    onAuthStateChange: demoAuth.onAuthStateChange,
  },
  from: (table: string) => createQueryBuilder(table),
}

