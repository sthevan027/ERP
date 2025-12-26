-- Rode ESTE arquivo sozinho (um Run separado) no Supabase SQL Editor.
-- Motivo: Postgres não permite usar um novo valor de ENUM na mesma transação
-- em que ele foi adicionado (erro 55P04).

do $$ begin
  alter type public.user_role add value 'unassigned';
exception
  when duplicate_object then null;
end $$;


