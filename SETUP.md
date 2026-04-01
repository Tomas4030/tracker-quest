# Setup - EstágioTrack

Guia de configuração da aplicação com Next.js e Supabase.

## Requisitos

- Node.js 18+
- npm
- Conta Supabase opcional

## Instalação

```bash
npm install
npm run dev
```

A aplicação abre em `http://localhost:3000`.

## Variáveis de ambiente

Copia `.env.local.example` para `.env.local` e ajusta os valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_NAME=EstágioTrack
```

Se deixares as variáveis vazias, a aplicação corre em modo demo com `localStorage`.

## Supabase

1. Cria um projeto em https://supabase.com
2. Vai a `Settings > API`
3. Copia o `Project URL` e o `anon public key`
4. Coloca os valores em `.env.local`

## Tabelas

Executa este SQL no Supabase:

```sql
create table if not exists users (
  id uuid primary key,
  name text not null,
  email text unique not null,
  role text not null check (role in ('admin', 'estagiario')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null check (status in ('em-curso', 'concluido', 'pendente')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Build

```bash
npm run build
npm run start
```
