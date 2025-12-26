import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readEnvFromFileIfPresent() {
  // Preferimos um arquivo separado para não misturar com as env do Vite.
  const envSeedPath = path.resolve(__dirname, '..', '.env.seed')
  if (fs.existsSync(envSeedPath)) {
    dotenv.config({ path: envSeedPath })
  }
}

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Variável ausente: ${name}. Crie web/.env.seed (use web/env.seed.example).`)
  return v
}

function optional(name, fallback) {
  return process.env[name] || fallback
}

function logStep(msg) {
  console.log(`\n==> ${msg}`)
}

async function main() {
  readEnvFromFileIfPresent()

  const SUPABASE_URL = required('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY')

  const ORG_NAME = optional('SEED_ORG_NAME', 'Galpão Demo')
  const WAREHOUSE_NAME = optional('SEED_WAREHOUSE_NAME', 'Galpão Principal')
  const METRIC_UNIT = optional('SEED_METRIC_UNIT', 'pallet')
  const METRIC_LABEL = optional('SEED_METRIC_LABEL', 'Pallets')
  const CAPACITY_TOTAL = Number(optional('SEED_CAPACITY_TOTAL', '1000'))
  const BUSINESS_CLIENT_NAME = optional('SEED_CLIENT_NAME', 'Cliente Demo')

  const managerEmail = optional('SEED_MANAGER_EMAIL', 'gestor@demo.local')
  const analystEmail = optional('SEED_ANALYST_EMAIL', 'analista@demo.local')
  const clientEmail = optional('SEED_CLIENT_EMAIL', 'cliente@demo.local')

  const managerPassword = optional('SEED_MANAGER_PASSWORD', 'ChangeMe123!')
  const analystPassword = optional('SEED_ANALYST_PASSWORD', 'ChangeMe123!')
  const clientPassword = optional('SEED_CLIENT_PASSWORD', 'ChangeMe123!')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  logStep('Criando org')
  const { data: org, error: orgErr } = await supabase
    .from('orgs')
    .insert({ name: ORG_NAME })
    .select('id, name')
    .single()
  if (orgErr) throw orgErr

  logStep('Criando galpão (warehouse)')
  const { data: wh, error: whErr } = await supabase
    .from('warehouses')
    .insert({
      org_id: org.id,
      name: WAREHOUSE_NAME,
      metric_unit: METRIC_UNIT,
      metric_label: METRIC_LABEL,
      capacity_total: CAPACITY_TOTAL,
    })
    .select('id, name')
    .single()
  if (whErr) throw whErr

  logStep('Criando cliente (entidade de negócio)')
  const { data: bizClient, error: clientErr } = await supabase
    .from('clients')
    .insert({ org_id: org.id, name: BUSINESS_CLIENT_NAME })
    .select('id, name')
    .single()
  if (clientErr) throw clientErr

  async function createAuthUser(email, password, fullName) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error) throw error
    return data.user
  }

  logStep('Criando usuários no Auth')
  const manager = await createAuthUser(managerEmail, managerPassword, 'Gestor Demo')
  const analyst = await createAuthUser(analystEmail, analystPassword, 'Analista Demo')
  const client = await createAuthUser(clientEmail, clientPassword, 'Cliente Demo')

  logStep('Vinculando perfis (profiles): org + role + client_id')
  const { error: upsertErr } = await supabase.from('profiles').upsert(
    [
      { user_id: manager.id, org_id: org.id, role: 'manager', client_id: null, full_name: 'Gestor Demo' },
      { user_id: analyst.id, org_id: org.id, role: 'analyst', client_id: null, full_name: 'Analista Demo' },
      { user_id: client.id, org_id: org.id, role: 'client', client_id: bizClient.id, full_name: 'Cliente Demo' },
    ],
    { onConflict: 'user_id' },
  )
  if (upsertErr) throw upsertErr

  logStep('Seed finalizado ✅')
  console.log('\nAcesse o app e faça login com:')
  console.log(`- Gestor:   ${managerEmail} / ${managerPassword}`)
  console.log(`- Analista: ${analystEmail} / ${analystPassword}`)
  console.log(`- Cliente:  ${clientEmail} / ${clientPassword}`)
  console.log('\nIDs criados:')
  console.log(`- org_id: ${org.id}`)
  console.log(`- warehouse_id: ${wh.id}`)
  console.log(`- client_id (negócio): ${bizClient.id}`)
}

main().catch((e) => {
  console.error('\nSeed falhou ❌')
  console.error(e)
  process.exit(1)
})


