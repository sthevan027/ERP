# ERP Galpão (React + Supabase)

ERP web para gerenciamento de armazenamento em galpões (logística), com **3 perfis**:

- **Gestor**: acesso total (configuração, visão geral, relatórios no futuro)
- **Analista de Armazém**: operação (recebimento, mudança de status/localização)
- **Cliente**: visualização restrita aos próprios produtos

## Stack

- **Frontend**: React + Vite + TypeScript
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth + RLS)

---

## 1) Modelagem do banco (tabelas e campos)

Arquivo: `supabase/schema.sql`

Tabelas principais (MVP):

- `orgs`: organização (multi-tenant)
- `profiles`: perfil do usuário (vinculado ao `auth.users`)
  - `role`: `manager | analyst | client`
  - `org_id`: tenant
  - `client_id`: obrigatório quando `role=client`
- `warehouses`: galpão + métrica (`metric_unit`, `metric_label`, `capacity_total`)
- `warehouse_locations`: posições/endereçamento (opcional no MVP; já previsto)
- `clients`: clientes (entidade de negócio)
- `products`: produtos com estados `in_transit | received | in_stock`, métrica e vínculo a cliente/galpão
- `product_events`: auditoria (previsto no MVP; UI pode evoluir depois)

---

## 2) Fluxo de autenticação e autorização

- **Login**: Supabase Auth (email/senha)
- Ao logar, o frontend carrega o `profiles` do usuário e determina:
  - `role` (Gestor/Analista/Cliente)
  - `org_id` (isolamento por tenant)
  - `client_id` (quando Cliente)
- Se o usuário ainda não tem `org_id`, cai na tela **Acesso pendente** (`/pendente`).

### Regras (alto nível)

- **Gestor**: lê/escreve tudo na própria `org_id`
- **Analista**: lê tudo na própria `org_id` e faz escrita operacional (produtos)
- **Cliente**: lê apenas produtos vinculados ao seu `client_id` na própria `org_id`

---

## 3) Estrutura de pastas do frontend (React)

Dentro de `web/src/`:

- `app/`
  - `providers/` (AuthProvider)
  - `routes/` (Protected, RoleGate)
  - `router.tsx` (rotas)
- `components/` (UI + AppShell)
- `features/`
  - `auth/` (Login, Acesso pendente)
  - `dashboard/` (Dashboard por perfil)
  - `products/` (Produtos + Recebimentos)
  - `warehouse/` (Config do galpão)
- `lib/` (supabase client, db, types, format)
- `styles/` (CSS global)

---

## 4) Componentes principais por perfil

### Gestor

- Dashboard geral (`/dashboard`)
- Configuração do galpão/métrica (`/config/galpao`)
- Produtos (cadastro + lista) (`/produtos`)

### Analista

- Dashboard operacional (`/dashboard`)
- Produtos (cadastro + lista) (`/produtos`)
- Recebimentos (`/recebimentos`)
  - registrar chegada: `in_transit → received`
  - marcar como em estoque: `received → in_stock`

### Cliente

- Dashboard (visão restrita) (`/dashboard`)
- Produtos (lista restrita via RLS) (`/produtos`)

---

## 5) Políticas RLS do Supabase (isolamento de dados)

Arquivo: `supabase/schema.sql`

Resumo:

- **Tenant**: todas as tabelas de negócio carregam `org_id`
- **Políticas**:
  - Gestor: acesso total na própria `org_id`
  - Analista: leitura na `org_id` + escrita operacional em `products`/`product_events`
  - Cliente: leitura apenas do que pertence ao `client_id`

---

## 6) Melhorias futuras (v2)

- Endereçamento completo (setores/ruas/níveis/posições) com capacidade por posição
- Movimentações (transferências entre posições), separação/expedição (saída)
- Relatórios (ocupação histórica, SLA de recebimento, atrasos)
- Auditoria completa via `product_events` + timeline na UI
- Convites e gestão de usuários (gestor cria usuários e define role via painel)
- Integração de recebimento via arquivo/API (EDI), etiquetas/QR Code
- Dashboard com gráficos e filtros (por cliente, por galpão, por período)

---

## Como rodar

### Banco (Supabase)

1. Crie um projeto no Supabase
2. Rode `supabase/schema.sql` no SQL Editor
3. Crie usuários no Auth
4. Faça o bootstrap (MVP):
   - Crie uma `orgs`
   - Atualize seu `profiles` para `role='manager'` e `org_id=<sua org>`
   - Crie ao menos um `warehouses` com `org_id=<sua org>`
   - Crie `clients` (clientes do galpão)
   - (Opcional) crie `warehouse_locations`

### Criar as 3 contas automaticamente (Gestor/Analista/Cliente)

1. No Supabase Dashboard, pegue a **Service Role Key** em:
   - Project Settings → API → `service_role` (NÃO use no frontend)
2. Copie `web/env.seed.example` para `web/.env.seed` e preencha:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Rode o seed:

```bash
cd web
pnpm seed:users
```

O script cria:
- 1 `orgs`
- 1 `warehouses`
- 1 `clients`
- 3 usuários no Auth + vínculo em `profiles` com role/org/client_id

### Fluxo recomendado (sem seed): usuário novo fica PENDENTE

Ajuste no banco: ao criar um usuário no Supabase Auth, a trigger cria `profiles` com:
- `role='unassigned'`
- `org_id=null`

Assim ele **não vira Cliente automaticamente**. O Gestor então define:
- `org_id`
- `role` (`manager`/`analyst`/`client`)
- e, se `client`, define também `client_id`

### Se aparecer erro 55P04 ao adicionar `unassigned` (enum)

Se seu projeto Supabase já existia antes e você recebeu:
`ERROR: 55P04: unsafe use of new value "unassigned" of enum type user_role`

Rode em **2 passos** no SQL Editor:

1) Rode **apenas**: `supabase/migrations/001_user_role_unassigned.sql`  
2) Depois rode: `supabase/schema.sql`

### Frontend (React)

1. Copie `web/env.example` para `web/.env.local` e preencha:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Instale deps e rode:

```bash
cd web
pnpm install
pnpm dev
```


