### TODO — ERP Galpão (para ficar funcional e bonito)

Este arquivo lista o que precisamos ajustar/melhorar para deixar o sistema **estável**, **seguro** e com **UX/UI** de nível produção.

---

## ✅ CONCLUÍDO

- **✅ Modo Demonstração (Frontend Only)**
  - Sistema funciona 100% no frontend usando `localStorage`
  - Perfeito para apresentações sem configurar banco de dados
  - Dados pré-carregados: 3 usuários, org, galpão, cliente, produtos
  - Credenciais: `gestor@demo.com` / `Gestor123!`, `analista@demo.com` / `Analista123!`, `cliente@demo.com` / `Cliente123!`

- **✅ Melhorias de Conexão com Banco**
  - Wrapper de queries com retry automático (`dbClient.ts`)
  - Timeout de 12s em todas as chamadas
  - Mensagens de erro traduzidas e amigáveis
  - Tratamento robusto de erros de rede/RLS/timeout

- **✅ Configuração de Ambiente**
  - `/setup` só aparece quando faltar env; com env ok, vai para `/login`
  - Em modo demo, pula configuração automaticamente
  - Validação de env no carregamento

- **✅ Loading Infinito Resolvido**
  - Timeout em todas as chamadas do Supabase
  - Estados de loading consistentes
  - Mensagens de erro claras quando falha

- **✅ Segurança de Profiles**
  - Usuário não pode alterar `role/org_id/client_id` via client-side
  - RPC `app.admin_assign_user_role()` criada para gestores vincularem usuários
  - Políticas RLS revisadas e corrigidas

---

## MVP (funcionar ponta-a-ponta)

- **Configurar Supabase corretamente no ambiente** ✅
  - **Status**: Concluído - sistema funciona em modo demo sem necessidade de Supabase
  - **Para produção**: garantir `web/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

- **Rodar migração do enum `unassigned` em 2 passos (Supabase SQL Editor)**
  - **Ação**: rodar `supabase/migrations/001_user_role_unassigned.sql` (um Run separado).
  - **Ação**: depois rodar `supabase/schema.sql`.
  - **Aceite**: sem erro `55P04`, trigger cria `profiles.role='unassigned'`.
  - **Nota**: Apenas necessário se usar Supabase real (não necessário para modo demo)

- **Bootstrap mínimo do banco (dados iniciais)** ✅
  - **Status**: Concluído - dados pré-carregados no modo demo
  - **Para produção**: criar `orgs`, `warehouses`, `clients` (manual ou seed).

- **Fluxo "Acesso pendente" completo** ✅
  - **Status**: Implementado com feedback visual
  - **Ação**: criar um jeito do Gestor vincular usuários:
    - definir `profiles.org_id`
    - definir `profiles.role`
    - se `role='client'`, definir `profiles.client_id`
  - **Aceite**: usuário recém-criado no Auth cai em `/pendente` e sai dali quando vinculado.

---

## Estabilidade (resolver "erros de instância" e "conexão com banco")

- **Padronizar "base URL / headers / timeout" nas chamadas do Supabase** ✅
  - **Status**: Concluído - `dbClient.ts` implementado
  - **Ação**: criar um wrapper de requests/erros em `web/src/lib/`:
    - timeout único (ex: 12s) + retry leve para GET (ex: 2 retries)
    - mensagens amigáveis para `Failed to fetch`, `401`, `403`, `JWT expired`, RLS, etc
  - **Aceite**: nenhuma tela fica "carregando infinito"; sempre mostra erro + ação sugerida.

- **Diagnóstico de conectividade**
  - **Ação**: manter/expandir o "Diagnóstico" do login:
    - mostrar host do Supabase (sem expor chave)
    - testar `/auth/v1/health`
    - sugerir checagem de firewall/proxy/antivírus
  - **Aceite**: quando falhar, sabemos se é "env", "rede" ou "Supabase down".
  - **Nota**: Removido da tela de login (modo demo não precisa)

- **Revisar estados de loading em todas as páginas** ✅
  - **Status**: Parcialmente concluído - loading infinito resolvido
  - **Ação**: criar componentes `LoadingCard` e `ErrorCard` (opcional para melhorar UX).
  - **Aceite**: padrões consistentes e sem "null render" (tela branca).

- **Conferir dependências e versão do Node** ✅
  - **Status**: Concluído - `pnpm dev` e `pnpm build` funcionando
  - **Ação**: manter Vite compatível com Node 18 (já baixado para Vite 5.4).
  - **Ação opcional**: atualizar Node para 20+ e voltar Vite 7 depois.
  - **Aceite**: `pnpm dev` e `pnpm build` funcionando sempre.

---

## Segurança (retirar/evitar coisas ruins e endurecer o sistema)

- **Nunca usar `service_role` no frontend**
  - **Ação**: garantir que `SUPABASE_SERVICE_ROLE_KEY` só exista em scripts locais (`.env.seed`) e nunca em `.env.local`.
  - **Aceite**: repositório não contém keys; frontend só usa `anon`.

- **RLS: revisar políticas para evitar “escapes”**
  - **Ação**: validar que todo acesso está condicionado a `org_id` do usuário.
  - **Ação**: garantir que cliente só veja seus produtos (`client_id`) e eventos vinculados.
  - **Aceite**: testes manuais com 2 orgs diferentes comprovam isolamento.

- **Lockdown de `profiles`** ✅
  - **Status**: Concluído - política RLS corrigida no schema
  - **Ação**: impedir que usuário altere `role/org_id/client_id` via client-side.
    - hoje `profiles_update_self` permite update de qualquer campo (ruim).
  - **Melhoria**:
    - permitir update self apenas de campos "seguros" (ex: `full_name`)
    - updates administrativos só por gestor (ou via RPC com validação)
  - **Aceite**: usuário comum não consegue se promover a gestor.

- **Criar RPCs (Postgres functions) para ações sensíveis** ✅
  - **Status**: Concluído - RPC `app.admin_assign_user_role()` criada no schema
  - **Ação**: `app.admin_assign_user_role(user_id, org_id, role, client_id)` com checagem de gestor.
  - **Aceite**: UI do gestor usa RPC, não update direto.

- **Auditoria real em `product_events`**
  - **Ação**: triggers em `products` para inserir eventos em transições:
    - `in_transit -> received`
    - `received -> in_stock`
    - mudanças de `location_id`
  - **Aceite**: trilha de auditoria sempre preenchida, sem depender do frontend.

---

## UX/UI (deixar bonito e consistente)

- **Design system mínimo**
  - **Ação**: consolidar componentes:
    - `Button`, `Input`, `Select`, `Card`, `Badge`, `Table`, `Modal`, `Toast`
  - **Aceite**: 1 padrão visual; sem CSS “espalhado”.

- **Layout por perfil**
  - **Ação**: dashboard específico por role:
    - Gestor: ocupação, status, alertas, visão por cliente/galpão
    - Analista: fila de recebimento, “para hoje”, ações rápidas
    - Cliente: somente seus produtos e timeline
  - **Aceite**: cada perfil tem 1 homepage com foco no seu trabalho.

- **Tabelas melhores**
  - **Ação**: substituir cards longos por tabelas com:
    - busca, filtro por status, paginação, ordenação
  - **Aceite**: lista de produtos escalável (1000+ sem travar).

- **Feedbacks**
  - **Ação**: toasts para sucesso/erro; estados “vazio” com CTA.
  - **Aceite**: usuário sabe o que fazer em cada tela.

---

## Funcionalidades (MVP+)

- **Cadastro/edição de galpões e clientes via UI (Gestor)**
  - **Ação**: telas CRUD para `warehouses` e `clients`.
  - **Aceite**: gestor não precisa do SQL Editor para operar.

- **Endereçamento e posições (v1.1)**
  - **Ação**: CRUD de `warehouse_locations`, com capacidade opcional por posição.
  - **Aceite**: produto em estoque pode ter `location_id`.

- **Ocupação correta**
  - **Ação**: cálculo por:
    - galpão inteiro (capacidade total)
    - opcional por posição (capacidade por `warehouse_locations`)
  - **Aceite**: dashboard mostra “usado/disponível” com base em `metric_qty`.

- **Saída/expedição (v2)**
  - **Ação**: status adicionais + eventos (separação, despacho).

---

## Refatoração/arquitetura (manutenibilidade)

- **Tipagem de banco**
  - **Ação**: gerar types do Supabase (ou declarar tipos consolidado) e remover casts.
  - **Aceite**: menos bugs e mais autocomplete.

- **Camada de “services”**
  - **Ação**: agrupar funções de banco em `features/*/api.ts` ou `lib/api/*`.
  - **Aceite**: páginas ficam “finas”.

- **Rotas e guards**
  - **Ação**: melhorar `RoleGate` para mensagens “acesso negado” (em vez de redirect silencioso).

---

## Limpeza (coisas que são ruins para segurança / produção)

- **Remover qualquer seed com senha fraca do fluxo padrão**
  - **Ação**: seed só para dev; em prod usar convite/gestor + reset de senha.

- **Bloquear prints/logs sensíveis**
  - **Ação**: nunca logar tokens, keys ou payloads de auth.

---

## Checklist final (antes de “valer”)

- **Supabase**
  - RLS habilitado em todas as tabelas
  - Policies revisadas (cliente isolado, org isolada)
  - Trigger de criação de profile como `unassigned`
  - RPC de admin para vincular usuários (preferível)

- **Frontend**
  - Sem loading infinito
  - Mensagens de erro claras
  - Navegação por perfil consistente
  - UI responsiva (desktop/tablet/mobile)


