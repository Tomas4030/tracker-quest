# EstágioTrack

Aplicação moderna de gestão de atividades em estágio, desenvolvida com Next.js, React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

- ✅ **Autenticação**: Login e registo de utilizadores
- ✅ **Dashboard**: Visualização de estatísticas e atividades recentes
- ✅ **Calendário**: Vista por dia, semana e mês com blocos de atividade
- ✅ **Registo de Atividades**: Criar, editar e eliminar atividades
- ✅ **Filtros e Pesquisa**: Filtrar por data e pesquisar atividades
- ✅ **Painel Admin**: Gerir contas, equipas, projetos e atividades
- ✅ **Relatórios AI**: Relatórios inteligentes com fallback local
- ✅ **Design Mobile-First**: Funciona em desktop, tablet e móvel

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Estado**: Zustand
- **Roteamento**: Next.js App Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Group API via rota server-side
- **Desenvolvimento**: Next.js
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. **Clonar repositório**

```bash
git clone <repository-url>
cd tracker-quest
```

2. **Instalar dependências**

```bash
npm install
```

3. **Configurar variáveis de ambiente**

```bash
# Copiar ficheiro de exemplo
cp .env.local.example .env.local

# Editar .env.local com as tuas credenciais do Supabase
```

4. **Iniciar servidor de desenvolvimento**

```bash
npm run dev
```

A aplicação abrirá em `http://localhost:3000`

## 📊 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Alert.tsx
│   ├── ActivityItem.tsx
│   ├── StatCard.tsx
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── screens/             # Componentes de ecrã/página
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── ActivitiesPage.tsx
│   ├── RegisterPage.tsx
│   ├── AdminOverviewPage.tsx
│   └── AdminReportPage.tsx
├── app/                 # Rotas Next.js
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   └── ...
├── services/            # Serviços e API
│   ├── supabase.ts
│   ├── authService.ts
│   ├── activityService.ts
│   └── index.ts
├── store/              # Estado global (Zustand)
│   └── index.ts
├── types/              # Tipos TypeScript
│   └── index.ts
├── utils/              # Funções utilitárias
│   └── helpers.ts
├── index.css
├── next-env.d.ts
└── next.config.mjs
```

## 🌐 Integração Supabase

### Passo 1: Criar Projeto Supabase

1. Acede a [supabase.com](https://supabase.com)
2. Cria um novo projeto
3. Copia as credenciais:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para bootstrap de admin)
- `GROUP_API_KEY`

### Passo 2: Criar Tabelas

Nao uses `CREATE TABLE` simples se a base ja existe, porque vai dar erro como:
`ERROR: relation "users" already exists`.

Usa o script idempotente do projeto:

- `supabase/safe_schema.sql`

Esse script pode ser corrido varias vezes sem erro porque usa:

- `create table if not exists`
- `alter table ... add column if not exists`
- `create index if not exists`
- `drop policy if exists` antes de `create policy`

Resumo rapido:

```sql
create table if not exists ...;
alter table ... add column if not exists ...;
create index if not exists ...;
drop policy if exists ...;
create policy ...;
```

### Passo 3: Configurar .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### Passo 4: Criar conta admin

```bash
ADMIN_EMAIL=admin@estagio.pt ADMIN_PASSWORD=<PASSWORD_FORTE> npm run create:admin
```

No PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@estagio.pt"; $env:ADMIN_PASSWORD="<PASSWORD_FORTE>"; npm run create:admin
```

### Passo 4: Atualizar Serviço de Autenticação

Se usares Supabase Auth com SSO, atualiza `src/services/authService.ts` para usar o Supabase diretamente.

## 📱 Componentes Principais

### Button

```tsx
<Button variant="primary" size="md">
  Guardar
</Button>
```

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="seu@email.com"
  error="Email inválido"
/>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardBody>Conteúdo...</CardBody>
</Card>
```

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Título"
  footer={<Button>Guardar</Button>}
>
  Conteúdo...
</Modal>
```

## 🎨 Customização

### Cores e Temas

As cores estão definidas em `tailwind.config.js`:

```javascript
colors: {
  primary: {...},     // Azul principal
  navy: '#0f172a',    // Azul escuro
  slate: {...},       // Tons de cinza
}
```

Para mudar cores, edita o ficheiro de configuração do Tailwind.

### Fontes

O projeto usa as fontes Google Fonts:

- **DM Sans**: Interface
- **DM Mono**: Código/dados estruturados

## 🚀 Deploy

### Vercel

```bash
# Ligar ao repositório no GitHub
# Configurar variáveis de ambiente no Vercel

npm run build
```

### Outras Plataformas

```bash
# Gerar build production
npm run build

# Preview local
npm run preview
```

## 📝 Ficheiro .env.local.example

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# App Configuration
NEXT_PUBLIC_APP_NAME=EstágioTrack
```

## 🐛 Troubleshooting

### Erro: "Supabase credentials not configured"

- Deixar ficheiro `.env.local` vazio para usar modo demo
- Ou preencher com credenciais válidas do Supabase

### Dados não persistem após reload

- Modo demo usa localStorage
- Para persistência em base de dados, configurar Supabase

### CORS errors

- Configurar CORS no painel do Supabase
- Adicionar domínio de desenvolvimento à allowlist

## 📚 Documentação Adicional

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Lucide Icons](https://lucide.dev)

## 📄 Licença

Este projeto é parte do programa de estágio. Todos os direitos reservados.

## 👨‍💻 Suporte

Para questões ou problemas, cria uma issue no repositório ou contacta o gestor do programa.

---

**Versão**: 1.0.0  
**Data**: 2024  
**Desenvolvido com ❤️**
