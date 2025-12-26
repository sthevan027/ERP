/*
  ERP - Galpão (Supabase / PostgreSQL)
  - Modelagem (MVP) + funções auxiliares + RLS (Row Level Security)

*/

-- Opcional (recomendado): agrupar funções auxiliares em um schema separado
create schema if not exists app;

-- Extensões
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.user_role as enum ('unassigned', 'manager', 'analyst', 'client');
exception when duplicate_object then null;
end $$;
-- IMPORTANTE (Supabase / Postgres):
-- Se seu projeto já existia e o enum `public.user_role` ainda NÃO tem o valor 'unassigned',
-- rode PRIMEIRO o arquivo `supabase/migrations/001_user_role_unassigned.sql` em um Run separado
-- (isso precisa "commit" antes de você usar o novo valor em defaults/inserts/updates).

do $$ begin
  create type public.storage_metric_unit as enum ('m2', 'pallet', 'box', 'position', 'custom');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_status as enum ('in_transit', 'received', 'in_stock');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_event_type as enum (
    'created',
    'status_changed',
    'received',
    'stocked',
    'moved',
    'note'
  );
exception when duplicate_object then null;
end $$;

-- Tabelas (multi-tenant por org)
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  metric_unit public.storage_metric_unit not null default 'pallet',
  metric_label text null, -- ex: "m²", "pallets", "posições"
  capacity_total numeric(18,4) not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table if not exists public.warehouse_locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  code text not null, -- ex: A-01-03
  description text null,
  capacity_total numeric(18,4) null, -- opcional; se null, assume que só controla por galpão
  created_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  document text null, -- CNPJ/CPF (opcional)
  contact_email text null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

-- Perfil do usuário (Auth -> perfil/app)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid null references public.orgs(id) on delete set null,
  role public.user_role not null default 'unassigned',
  client_id uuid null references public.clients(id) on delete set null, -- usado quando role=client
  full_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migração segura (se a tabela já existe): atualiza o default
alter table public.profiles alter column role set default 'unassigned';

create index if not exists profiles_org_id_idx on public.profiles(org_id);
create index if not exists profiles_client_id_idx on public.profiles(client_id);

-- Produtos (3 estados principais)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  sku text not null,
  description text null,
  status public.product_status not null default 'in_transit',
  expected_arrival_date date null,
  received_at timestamptz null,
  in_stock_at timestamptz null,
  metric_qty numeric(18,4) not null default 0,
  location_id uuid null references public.warehouse_locations(id) on delete set null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_org_id_idx on public.products(org_id);
create index if not exists products_client_id_idx on public.products(client_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_expected_arrival_idx on public.products(expected_arrival_date);

-- Eventos (auditoria/movimentação)
create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  event_type public.product_event_type not null,
  from_status public.product_status null,
  to_status public.product_status null,
  from_location_id uuid null references public.warehouse_locations(id) on delete set null,
  to_location_id uuid null references public.warehouse_locations(id) on delete set null,
  notes text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists product_events_product_id_idx on public.product_events(product_id);
create index if not exists product_events_org_id_idx on public.product_events(org_id);

-- Funções auxiliares (RLS)
create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function app.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.user_id = auth.uid();
$$;

create or replace function app.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.org_id from public.profiles p where p.user_id = auth.uid();
$$;

create or replace function app.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.user_id = auth.uid();
$$;

create or replace function app.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.client_id from public.profiles p where p.user_id = auth.uid();
$$;

create or replace function app.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'manager' from public.profiles p where p.user_id = auth.uid()), false);
$$;

create or replace function app.is_analyst()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'analyst' from public.profiles p where p.user_id = auth.uid()), false);
$$;

create or replace function app.is_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'client' from public.profiles p where p.user_id = auth.uid()), false);
$$;

-- Triggers genéricos de updated_at
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger products_set_updated_at
  before update on public.products
  for each row execute function app.set_updated_at();
exception when duplicate_object then null;
end $$;

-- Trigger: criar profile ao criar usuário no Auth (default role=unassigned / pendente)
create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, full_name)
  values (new.id, 'unassigned', coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Migração opcional: usuários “soltos” (sem org) que estavam como client viram unassigned
update public.profiles
set role = 'unassigned'
where org_id is null and role = 'client';

do $$ begin
  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_auth_user();
exception when duplicate_object then null;
end $$;

-- RLS
alter table public.orgs enable row level security;
alter table public.warehouses enable row level security;
alter table public.warehouse_locations enable row level security;
alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_events enable row level security;

-- ORGS: gestor acessa sua org; analista não mexe; cliente não mexe
drop policy if exists orgs_select_manager on public.orgs;
create policy orgs_select_manager
on public.orgs for select
using (app.is_manager() and id = app.current_org_id());

drop policy if exists orgs_write_manager on public.orgs;
create policy orgs_write_manager
on public.orgs for all
using (app.is_manager() and id = app.current_org_id())
with check (app.is_manager() and id = app.current_org_id());

-- PROFILES: usuário vê o próprio perfil; gestor pode ver/gerenciar perfis da org
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles for select
using (user_id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists profiles_select_manager on public.profiles;
create policy profiles_select_manager
on public.profiles for select
using (app.is_manager() and org_id = app.current_org_id());

drop policy if exists profiles_update_manager on public.profiles;
create policy profiles_update_manager
on public.profiles for update
using (app.is_manager() and org_id = app.current_org_id())
with check (app.is_manager() and org_id = app.current_org_id());

-- WAREHOUSES: gestor (all) / analista (select) / cliente (no)
drop policy if exists warehouses_select_staff on public.warehouses;
create policy warehouses_select_staff
on public.warehouses for select
using ((app.is_manager() or app.is_analyst()) and org_id = app.current_org_id());

drop policy if exists warehouses_write_manager on public.warehouses;
create policy warehouses_write_manager
on public.warehouses for all
using (app.is_manager() and org_id = app.current_org_id())
with check (app.is_manager() and org_id = app.current_org_id());

-- LOCATIONS: gestor (all) / analista (select) / cliente (no)
drop policy if exists locations_select_staff on public.warehouse_locations;
create policy locations_select_staff
on public.warehouse_locations for select
using ((app.is_manager() or app.is_analyst()) and org_id = app.current_org_id());

drop policy if exists locations_write_manager on public.warehouse_locations;
create policy locations_write_manager
on public.warehouse_locations for all
using (app.is_manager() and org_id = app.current_org_id())
with check (app.is_manager() and org_id = app.current_org_id());

-- CLIENTS: gestor (all) / analista (select) / cliente (select seu client_id)
drop policy if exists clients_select_staff on public.clients;
create policy clients_select_staff
on public.clients for select
using ((app.is_manager() or app.is_analyst()) and org_id = app.current_org_id());

drop policy if exists clients_select_self on public.clients;
create policy clients_select_self
on public.clients for select
using (app.is_client() and org_id = app.current_org_id() and id = app.current_client_id());

drop policy if exists clients_write_manager on public.clients;
create policy clients_write_manager
on public.clients for all
using (app.is_manager() and org_id = app.current_org_id())
with check (app.is_manager() and org_id = app.current_org_id());

-- PRODUCTS: gestor/analista (select/insert/update); cliente (select restrito)
drop policy if exists products_select_staff on public.products;
create policy products_select_staff
on public.products for select
using ((app.is_manager() or app.is_analyst()) and org_id = app.current_org_id());

drop policy if exists products_select_client on public.products;
create policy products_select_client
on public.products for select
using (app.is_client() and org_id = app.current_org_id() and client_id = app.current_client_id());

drop policy if exists products_insert_staff on public.products;
create policy products_insert_staff
on public.products for insert
with check (
  (app.is_manager() or app.is_analyst())
  and org_id = app.current_org_id()
  and created_by = auth.uid()
);

drop policy if exists products_update_staff on public.products;
create policy products_update_staff
on public.products for update
using (
  (app.is_manager() or app.is_analyst())
  and org_id = app.current_org_id()
)
with check (
  (app.is_manager() or app.is_analyst())
  and org_id = app.current_org_id()
  and updated_by = auth.uid()
);

drop policy if exists products_delete_manager on public.products;
create policy products_delete_manager
on public.products for delete
using (app.is_manager() and org_id = app.current_org_id());

-- PRODUCT_EVENTS: gestor/analista (insert/select); cliente (select restrito)
drop policy if exists product_events_select_staff on public.product_events;
create policy product_events_select_staff
on public.product_events for select
using ((app.is_manager() or app.is_analyst()) and org_id = app.current_org_id());

drop policy if exists product_events_select_client on public.product_events;
create policy product_events_select_client
on public.product_events for select
using (
  app.is_client()
  and org_id = app.current_org_id()
  and exists (
    select 1
    from public.products p
    where p.id = product_events.product_id
      and p.client_id = app.current_client_id()
      and p.org_id = app.current_org_id()
  )
);

drop policy if exists product_events_insert_staff on public.product_events;
create policy product_events_insert_staff
on public.product_events for insert
with check (
  (app.is_manager() or app.is_analyst())
  and org_id = app.current_org_id()
  and created_by = auth.uid()
);

-- Observação:
-- Para operações administrativas (criar org/warehouse inicial, promover usuário a gestor etc),
-- use o Service Role (server-side) ou faça manualmente no SQL Editor.


