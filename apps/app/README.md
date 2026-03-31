# WazeFit App

Aplicação Next.js 15 white label para gestão de treinos e nutrição.

## 🚀 Stack

- **Next.js 15** - App Router
- **TypeScript** - Strict mode
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **OpenNext** - Deploy Cloudflare
- **Jose** - JWT authentication

## 📁 Estrutura

```
apps/app/
├── app/
│   ├── layout.tsx              # Root layout (tenant + theme providers)
│   ├── page.tsx                # Home (redirect baseado em role)
│   ├── login/                  # Login universal
│   ├── expert/                 # Painel Expert (admin)
│   │   ├── layout.tsx          # Layout com sidebar
│   │   ├── dashboard/          # Dashboard com métricas
│   │   ├── alunos/             # Gestão de alunos
│   │   ├── fichas/             # Fichas de treino
│   │   ├── ia/                 # IA Assistant
│   │   ├── nutricao/           # Planos nutricionais
│   │   └── analytics/          # Analytics e relatórios
│   └── user/                   # Painel User (cliente)
│       ├── layout.tsx          # Layout mobile-first
│       ├── treinos/            # Treinos do aluno
│       ├── dieta/              # Dieta do aluno
│       ├── ranking/            # Ranking gamificado
│       └── chat/               # Chat com personal
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layouts/
│   │   ├── expert-sidebar.tsx  # Sidebar do painel expert
│   │   └── user-nav.tsx        # Bottom nav mobile
│   └── providers/
│       ├── tenant-provider.tsx # Context de white label
│       └── theme-provider.tsx  # Dark mode
├── lib/
│   ├── utils.ts                # Utilities (cn, etc)
│   ├── auth.ts                 # JWT auth + API client
│   └── tenant.ts               # Tenant detection & config
└── package.json
```

## 🎨 Design System

### Cores Brandáveis (White Label)

O sistema usa CSS variables para permitir customização por tenant:

```css
:root {
  --primary: 240 5.9% 10%;
  --secondary: 240 4.8% 95.9%;
  /* ... */
}
```

Cada tenant pode ter:
- Logo customizado
- Cores primárias/secundárias
- Domínio próprio

### Dark Mode

Suportado via `next-themes` com classes do Tailwind.

## 🔐 Autenticação

### Flow

1. **Login** → `/login`
   - Envia credenciais para `/api/auth/login`
   - API valida com backend (`api.wazefit.com`)
   - Retorna JWT token
   - Token salvo em cookie httpOnly

2. **Proteção de rotas**
   - Layouts verificam `getUser()` (server-side)
   - Redirect para `/login` se não autenticado
   - Redirect baseado em role (expert/user)

3. **API Client**
   - Helper `apiClient()` inclui token automaticamente
   - Requests para `api.wazefit.com`

### Mock de Desenvolvimento

Atualmente usa mock local:
- Email com "expert" → role expert
- Outros → role user

**Produção**: Descomentar código em `/api/auth/login/route.ts` para integrar com API real.

## 🏢 White Label (Multi-Tenant)

### Detecção de Tenant

```typescript
// lib/tenant.ts
export async function getTenant(): Promise<TenantConfig> {
  const host = headers().get("host");
  
  // Consulta API para buscar config do tenant
  // const tenant = await fetch(`api.wazefit.com/tenants/by-domain/${host}`);
  
  return tenant;
}
```

### Configuração por Tenant

```typescript
interface TenantConfig {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;    // HSL format
  secondaryColor: string;  // HSL format
  domain: string;
}
```

### Uso no Client

```tsx
import { useTenant } from "@/components/providers/tenant-provider";

function MyComponent() {
  const tenant = useTenant();
  return <img src={tenant.logo} alt={tenant.name} />;
}
```

## 📱 Layouts

### Expert (Desktop)

- **Sidebar** fixa à esquerda
- Navegação: Dashboard, Alunos, Fichas, IA, Nutrição, Analytics
- Design desktop-first
- Otimizado para gestão e análise

### User (Mobile-First)

- **Bottom navigation** fixa
- 4 seções principais: Treinos, Dieta, Ranking, Chat
- Cards grandes e touch-friendly
- Otimizado para uso rápido

## 🚀 Deploy (Cloudflare)

### Setup OpenNext

1. Instalar OpenNext:
```bash
npm install -D open-next@latest
```

2. Build:
```bash
npm run build
npx open-next@latest build
```

3. Deploy para Cloudflare Pages:
```bash
# Conectar repositório ou usar wrangler
wrangler pages deploy .open-next/cloudflare
```

### Variáveis de Ambiente

No Cloudflare Pages, configurar:

```
JWT_SECRET=your-production-secret
NEXT_PUBLIC_API_URL=https://api.wazefit.com
NODE_ENV=production
```

## 🛠️ Desenvolvimento

### Instalar dependências

```bash
npm install
```

### Rodar dev server

```bash
npm run dev
```

Acessar: http://localhost:3000

### Login de Teste

- **Expert**: `expert@wazefit.com` / qualquer senha
- **User**: `user@wazefit.com` / qualquer senha

## 📦 Componentes shadcn/ui

Componentes instalados:
- Button
- Input
- Card
- (Adicionar mais conforme necessário)

Para adicionar novos:
```bash
npx shadcn@latest add <component-name>
```

## 🔗 Integração com API

### Endpoints Esperados

```
POST /auth/login
  Body: { email, password }
  Response: { user, token }

GET /tenants/by-domain/:domain
  Response: TenantConfig

GET /users/:id/workouts
GET /users/:id/nutrition
GET /experts/:id/students
...
```

### Client Helper

```typescript
import { apiClient } from "@/lib/auth";

// Automaticamente inclui auth token
const data = await apiClient("/users/123/workouts");
```

## 🎯 Próximos Passos

- [ ] Integrar com API real (`api.wazefit.com`)
- [ ] Implementar CRUD completo de alunos/fichas
- [ ] Adicionar gráficos (recharts/tremor)
- [ ] Sistema de notificações
- [ ] Upload de imagens (progresso, avatares)
- [ ] PWA (Service Worker)
- [ ] Analytics (Plausible/Umami)
- [ ] E2E tests (Playwright)

## 📝 Notas

- **TypeScript strict**: Todos os arquivos são type-safe
- **Responsive**: Expert = desktop, User = mobile-first
- **Dark mode**: Suportado em toda a aplicação
- **White label**: Pronto para multi-tenant
- **Edge-ready**: OpenNext + Cloudflare Workers

---

**Desenvolvido para WazeFit** 💪
