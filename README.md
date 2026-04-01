# EstágioTrack

Aplicação moderna de gestão de atividades em estágio, desenvolvida com Next.js, React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

- ✅ **Autenticação**: Login e registo de utilizadores
- ✅ **Dashboard**: Visualização de estatísticas e atividades recentes
- ✅ **Registo de Atividades**: Criar, editar e eliminar atividades
- ✅ **Filtros e Pesquisa**: Filtrar por data e pesquisar atividades
- ✅ **Painel Admin**: Gerir todos os estagiários e atividades
- ✅ **Relatórios**: Estatísticas e produtividade por estagiário
- ✅ **Design Responsivo**: Funciona em desktop, tablet e móvel
- ✅ **Modo Demo**: Dados armazenados em localStorage

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Estado**: Zustand
- **Roteamento**: Next.js App Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **Desenvolvimento**: Next.js
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase (opcional - app funciona em modo demo)

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

# Editar .env.local com as tuas credenciais do Supabase (opcional)
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

## 🔐 Autenticação Demo

A aplicação vem com dados de demo pré-carregados:

| Tipo       | Email            | Palavra-passe |
| ---------- | ---------------- | ------------- |
| Admin      | admin@estagio.pt | admin123      |
| Estagiário | ana@estagio.pt   | ana123        |
| Estagiário | bruno@estagio.pt | bruno123      |

## 🌐 Integração Supabase

### Passo 1: Criar Projeto Supabase

1. Acede a [supabase.com](https://supabase.com)
2. Cria um novo projeto
3. Copia as credenciais:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Passo 2: Criar Tabelas

Execute o seguinte SQL no console do Supabase:

```sql
-- Tabela de utilizadores
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'estagiario')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de atividades
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('em-curso', 'concluido', 'pendente')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX activities_user_id_idx ON activities(user_id);
CREATE INDEX activities_date_idx ON activities(date);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (opcional - configurar conforme necessário)
```

### Passo 3: Configurar .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
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
