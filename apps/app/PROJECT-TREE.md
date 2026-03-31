# 🌳 Árvore do Projeto - WazeFit App

```
apps/app/
│
├── 📱 app/                           # Next.js 15 App Router
│   │
│   ├── 🎨 globals.css                # Estilos globais + CSS variables
│   ├── 📄 layout.tsx                 # Root layout (providers)
│   ├── 📄 page.tsx                   # Home (redirect por role)
│   │
│   ├── 🔐 login/                     # Autenticação
│   │   └── page.tsx                  # Página de login
│   │
│   ├── 👨‍💼 expert/                     # Painel Expert (Admin)
│   │   ├── layout.tsx                # Layout com sidebar
│   │   ├── dashboard/                # 📊 Dashboard com métricas
│   │   │   └── page.tsx
│   │   ├── alunos/                   # 👥 Gestão de alunos
│   │   │   └── page.tsx
│   │   ├── fichas/                   # 📋 Fichas de treino
│   │   │   └── page.tsx
│   │   ├── ia/                       # 🤖 IA Assistant
│   │   │   └── page.tsx
│   │   ├── nutricao/                 # 🥗 Planos nutricionais
│   │   │   └── page.tsx
│   │   └── analytics/                # 📈 Analytics e relatórios
│   │       └── page.tsx
│   │
│   ├── 👤 user/                      # Painel User (Cliente)
│   │   ├── layout.tsx                # Layout mobile-first
│   │   ├── treinos/                  # 💪 Treinos do aluno
│   │   │   └── page.tsx
│   │   ├── dieta/                    # 🍎 Dieta do aluno
│   │   │   └── page.tsx
│   │   ├── ranking/                  # 🏆 Ranking gamificado
│   │   │   └── page.tsx
│   │   └── chat/                     # 💬 Chat com personal
│   │       └── page.tsx
│   │
│   └── 🔌 api/                       # API Routes
│       └── auth/
│           └── login/
│               └── route.ts          # Endpoint de login
│
├── 🧩 components/                    # Componentes React
│   │
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx                # Botão
│   │   ├── input.tsx                 # Input
│   │   └── card.tsx                  # Card
│   │
│   ├── layouts/                      # Layouts customizados
│   │   ├── expert-sidebar.tsx        # Sidebar do expert
│   │   └── user-nav.tsx              # Bottom nav do user
│   │
│   └── providers/                    # Context Providers
│       ├── tenant-provider.tsx       # White label context
│       └── theme-provider.tsx        # Dark mode
│
├── 🛠️ lib/                           # Utilities & Helpers
│   ├── utils.ts                      # cn(), helpers gerais
│   ├── auth.ts                       # JWT, cookies, API client
│   └── tenant.ts                     # Multi-tenant detection
│
├── 🌍 public/                        # Static assets
│   └── wazefit-logo.svg              # Logo padrão
│
├── ⚙️ Configuração
│   ├── package.json                  # Dependências e scripts
│   ├── tsconfig.json                 # TypeScript config
│   ├── tailwind.config.ts            # Tailwind config
│   ├── next.config.ts                # Next.js config
│   ├── components.json               # shadcn/ui config
│   ├── postcss.config.mjs            # PostCSS config
│   ├── .eslintrc.json                # ESLint config
│   ├── .gitignore                    # Git ignore
│   └── .env.example                  # Environment variables
│
├── 🔒 Segurança
│   └── middleware.ts                 # Auth + role protection
│
└── 📚 Documentação
    ├── README.md                     # Overview completo (6KB)
    ├── SETUP.md                      # Guia de instalação (4KB)
    ├── ARCHITECTURE.md               # Arquitetura técnica (8KB)
    ├── CHECKLIST.md                  # Checklist de implementação (5KB)
    ├── DONE.md                       # Resumo da entrega (8KB)
    ├── COMMANDS.md                   # Comandos úteis (5KB)
    └── PROJECT-TREE.md               # Este arquivo
```

## 📊 Estatísticas

### Arquivos por Categoria

```
📱 Páginas:          12 arquivos
🧩 Componentes:       8 arquivos
🛠️ Lib/Utils:         3 arquivos
⚙️ Configuração:      9 arquivos
📚 Documentação:      7 arquivos
🔒 Middleware:        1 arquivo
───────────────────────────────
Total:               40 arquivos
```

### Linhas de Código (Estimativa)

```
TypeScript/TSX:    ~2,500 linhas
CSS:                 ~200 linhas
Configuração:        ~300 linhas
Documentação:      ~1,500 linhas
───────────────────────────────
Total:             ~4,500 linhas
```

### Tamanho dos Arquivos

```
Código:              ~80 KB
Documentação:        ~36 KB
Configuração:        ~10 KB
───────────────────────────────
Total:              ~126 KB
```

## 🎯 Fluxo de Navegação

### Expert (Admin)

```
Login
  ↓
Dashboard (métricas gerais)
  ├→ Alunos (gestão)
  ├→ Fichas (treinos)
  ├→ IA (ferramentas)
  ├→ Nutrição (planos)
  └→ Analytics (relatórios)
```

### User (Cliente)

```
Login
  ↓
Treinos (lista semanal)
  ├→ Dieta (macros)
  ├→ Ranking (gamificação)
  └→ Chat (suporte)
```

## 🔐 Fluxo de Autenticação

```
Browser
  ↓
POST /api/auth/login
  ↓
Validate (backend)
  ↓
Create JWT
  ↓
Set httpOnly cookie
  ↓
Middleware (verify)
  ↓
Redirect by role
  ├→ Expert → /expert/dashboard
  └→ User → /user/treinos
```

## 🏢 Fluxo Multi-Tenant

```
Request (custom.domain.com)
  ↓
Middleware (extract host)
  ↓
getTenant() (query API)
  ↓
TenantConfig
  ├─ id
  ├─ name
  ├─ logo
  ├─ primaryColor
  └─ domain
  ↓
TenantProvider (inject context)
  ↓
Apply branding
  ├─ CSS variables
  ├─ Logo
  └─ Colors
```

## 📦 Dependências Principais

```
Production:
├── next (15.5.14)
├── react (19.0.0)
├── typescript (5.7.2)
├── tailwindcss (3.4.17)
├── jose (JWT)
├── next-themes (dark mode)
└── lucide-react (icons)

Dev:
├── @types/* (type definitions)
├── eslint (linting)
├── autoprefixer (CSS)
└── postcss (CSS processing)

UI:
├── class-variance-authority
├── clsx
├── tailwind-merge
└── tailwindcss-animate
```

## 🎨 Design Tokens

```css
/* CSS Variables (White Label) */
:root {
  --background:    0 0% 100%
  --foreground:    240 10% 3.9%
  --primary:       240 5.9% 10%      /* Brandable */
  --secondary:     240 4.8% 95.9%    /* Brandable */
  --accent:        240 4.8% 95.9%
  --muted:         240 4.8% 95.9%
  --destructive:   0 84.2% 60.2%
  --border:        240 5.9% 90%
  --input:         240 5.9% 90%
  --ring:          240 5.9% 10%
  --radius:        0.5rem
}
```

## 🚀 Build Output

```
Route (app)                Size    First Load JS
├ /                       149 B   102 kB
├ /expert/dashboard       149 B   102 kB
├ /expert/alunos          149 B   102 kB
├ /expert/fichas          149 B   102 kB
├ /expert/ia              149 B   102 kB
├ /expert/nutricao        149 B   102 kB
├ /expert/analytics       149 B   102 kB
├ /user/treinos           149 B   102 kB
├ /user/dieta             149 B   102 kB
├ /user/ranking           149 B   102 kB
├ /user/chat              2.6 kB  112 kB
└ /login                  2.2 kB  111 kB

Middleware                40.1 kB
```

## 🏆 Qualidade

```
✅ TypeScript strict      100%
✅ Build success          ✓
✅ Zero vulnerabilities   ✓
✅ Lint passing           ✓
✅ Type check passing     ✓
✅ Responsive design      ✓
✅ Dark mode              ✓
✅ White label ready      ✓
✅ Deploy ready           ✓
✅ Documented             ✓
```

---

**Legenda:**
- 📱 App Router (Next.js)
- 🧩 Componentes
- 🛠️ Utilities
- 🔐 Autenticação
- 👨‍💼 Expert Panel
- 👤 User Panel
- 🏢 Multi-Tenant
- 📚 Documentação
- ⚙️ Configuração
- 🔒 Segurança
