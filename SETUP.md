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
GROUP_API_KEY=
NEXT_PUBLIC_APP_NAME=EstágioTrack
```

Se deixares as variáveis vazias, a aplicação corre em modo demo com `localStorage` e o relatório inteligente usa o fallback local.

## Supabase

1. Cria um projeto em https://supabase.com
2. Vai a `Settings > API`
3. Copia o `Project URL` e o `anon public key`
4. Coloca os valores em `.env.local`

## Tabelas

Para evitar erros como `relation "users" already exists`, usa o script seguro abaixo.
Ele pode ser corrido várias vezes sem rebentar em tabelas/índices/policies já existentes.

1. Abre o SQL Editor no Supabase
2. Cola o conteúdo de `supabase/safe_schema.sql`
3. Executa

Script principal: `supabase/safe_schema.sql`

Resumo do que ele faz:

```sql
create table if not exists ...;
alter table ... add column if not exists ...;
create index if not exists ...;
drop policy if exists ...;
create policy ...;
```

### Rota AI

O relatório inteligente usa `app/api/reports/group/route.ts`.

- `GROUP_API_KEY`: chave de autenticação da API

Nota: o endpoint da Group API está fixo no backend da app; só precisas de configurar a key.

Se estas variáveis não existirem, a app gera o relatório com analytics local para não bloquear a utilização.

## Build

```bash
npm run build
npm run start
```
