-- Ejecutar en el SQL Editor de tu proyecto de Supabase.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- El microservicio accede con la service_role key, que ignora Row Level
-- Security. Aun así, dejamos RLS activado y sin policies públicas para que
-- la tabla quede bloqueada por defecto frente a cualquier acceso con la
-- anon key (por ejemplo, si en el futuro se usa el cliente de Supabase
-- directamente desde la app).
alter table public.users enable row level security;
