# Arquitetura Técnica - WazeFit App

## 📐 Visão Geral

Sistema white label multi-tenant para gestão de treinos e nutrição, construído com Next.js 15 e deployado na edge (Cloudflare Workers).

## 🏗️ Camadas

```
┌─────────────────────────────────────────┐
│         Cloudflare Workers (Edge)       │
│         (OpenNext Runtime)              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Next.js 15 App Router           │
│  ┌───────────────────────────────────┐  │
│  │  Middleware (Auth + Tenant)       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Server Components (RSC)          │  │
│  │  - Layouts (auth check)           │  │
│  │  - Pages (data fetch)             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Client Components                │  │
│  │  - Interactive UI                 │  │
│  │  - Forms, Modals                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API Backend                     │
│         api.wazefit.com                 │
│  - Auth (JWT)                           │
│  - Tenant Config                        │
│  - User Data (workouts, nutrition)      │
│  - Expert Data (students, plans)        │
└─────────────────────────────────────────┘
```

## 🔐 Fluxo de Autenticação

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. POST /api/auth/login
     │    { email, password }
     ↓
┌─────────────────┐
│ API Route       │
│ /api/auth/login │
└────┬────────────┘
     │ 2. Validate with backend
     │    POST api.wazefit.com/auth/login
     ↓
┌──────────────┐
│ Backend API  │
└────┬─────────┘
     │ 3. Return user + token
     ↓
┌─────────────────┐
│ API Route       │
│ - Create JWT    │
│ - Set httpOnly  │
│   cookie        │
└────┬────────────┘
     │ 4. Redirect to dashboard
     ↓
┌──────────────┐
│ Middleware   │
│ - Verify JWT │
│ - Check role │
└────┬─────────┘
     │ 5. Allow access
     ↓
┌─────────┐
│ Page    │
│ Render  │
└─────────┘
```

## 🏢 Multi-Tenant Flow

```
┌─────────┐
│ Request │
│ custom.domain.com
└────┬────┘
     │
     ↓
┌────────────────┐
│ Middleware     │
│ Extract host   │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ getTenant()    │
│ - Query API    │
│ - Get config   │
└────┬───────────┘
     │
     ↓
┌────────────────────────┐
│ TenantConfig           │
│ {                      │
│   id: "abc123"         │
│   name: "GymXYZ"       │
│   logo: "url"          │
│   primaryColor: "HSL"  │
│   domain: "custom.com" │
│ }                      │
└────┬───────────────────┘
     │
     ↓
┌────────────────┐
│ TenantProvider │
│ (React Context)│
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ Apply styles   │
│ Inject logo    │
│ Render app     │
└────────────────┘
```

## 📂 Estrutura de Rotas

### Server Components (Default)

```
app/
├── layout.tsx              # Root (providers, tenant detection)
├── page.tsx                # Redirect baseado em role
├── login/page.tsx          # Public (client component)
├── expert/
│   ├── layout.tsx          # Auth check + sidebar
│   └── */page.tsx          # Protected pages
└── user/
    ├── layout.tsx          # Auth check + mobile nav
    └── */page.tsx          # Protected pages
```

### Client Components

Marcados com `"use client"`:
- Forms (login, create workout)
- Interactive UI (chat, modals)
- Context consumers (useTenant, useTheme)

## 🎨 Design System

### CSS Variables (Brandable)

```css
:root {
  /* Base colors (default theme) */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  
  /* Tenant-specific (injected dinamicamente) */
  --primary: <tenant.primaryColor>;
  --secondary: <tenant.secondaryColor>;
}
```

### Theme Switching

```
┌──────────────┐
│ ThemeProvider│
│ (next-themes)│
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ localStorage │
│ theme: "dark"│
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ <html class= │
│   "dark">    │
└──────────────┘
```

## 🔒 Segurança

### Cookies httpOnly

```typescript
setAuthCookie(token, {
  httpOnly: true,      // Não acessível via JS
  secure: true,        // HTTPS only (produção)
  sameSite: "lax",     // CSRF protection
  maxAge: 7 * 24 * 60 * 60  // 7 dias
});
```

### JWT Structure

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "expert",
    "tenantId": "abc"
  },
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Middleware Protection

```typescript
// Executa em TODA requisição
export async function middleware(request) {
  // 1. Check public routes
  // 2. Verify JWT token
  // 3. Check role-based access
  // 4. Redirect se unauthorized
}
```

## 📊 Data Flow

### Expert → API

```
┌────────────────┐
│ Expert Page    │
│ /expert/alunos │
└────┬───────────┘
     │ Server Component
     ↓
┌────────────────┐
│ getUser()      │
│ (auth check)   │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ apiClient()    │
│ GET /students  │
│ + JWT token    │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ Backend API    │
│ - Validate JWT │
│ - Check tenant │
│ - Return data  │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ Render Page    │
│ with data      │
└────────────────┘
```

### User → Realtime Updates

```
┌────────────────┐
│ User Page      │
│ /user/treinos  │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ Initial SSR    │
│ (server fetch) │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ Client hydrate │
│ Setup SSE/WS   │
└────┬───────────┘
     │
     ↓
┌────────────────┐
│ Realtime       │
│ updates        │
│ (via API)      │
└────────────────┘
```

## 🚀 Deploy Architecture

### Cloudflare Workers (Edge)

```
┌─────────────────────────────────────┐
│ Cloudflare Edge Network             │
│ ┌─────────────────────────────────┐ │
│ │ Worker (OpenNext Runtime)       │ │
│ │ - SSR (Server Components)       │ │
│ │ - API Routes                    │ │
│ │ - Middleware                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Static Assets (/_next/static)   │ │
│ │ - JS bundles                    │ │
│ │ - CSS                           │ │
│ │ - Images                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Build Output (OpenNext)

```
.open-next/
└── cloudflare/
    ├── _worker.js         # Edge function
    ├── _routes.json       # Routing config
    └── _assets/           # Static files
```

## 📦 Bundle Optimization

### Code Splitting

```
app/expert/     → expert.chunk.js  (lazy)
app/user/       → user.chunk.js    (lazy)
components/ui/  → ui.chunk.js      (shared)
```

### Image Optimization

- Next.js Image component
- WebP/AVIF formats
- Lazy loading
- Responsive srcset

## 🔄 State Management

### Server State (RSC)

```typescript
// Server Component (default)
async function Page() {
  const data = await apiClient("/endpoint");
  return <UI data={data} />;
}
```

### Client State (React)

```typescript
// Client Component
"use client";
function Form() {
  const [state, setState] = useState();
  // Local UI state only
}
```

### Global State (Context)

```typescript
// Tenant, Theme
<TenantProvider>
  <ThemeProvider>
    {children}
  </ThemeProvider>
</TenantProvider>
```

## 🧪 Testing Strategy

### Unit Tests (Vitest)

- Utils functions
- Auth helpers
- Tenant detection

### Integration Tests (Playwright)

- Login flow
- Expert CRUD
- User workouts
- Multi-tenant

### E2E Tests

- Full user journeys
- Cross-browser
- Mobile devices

## 📈 Performance Targets

- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **TTI**: < 3.5s
- **CLS**: < 0.1
- **Lighthouse**: > 90

### Strategies

- Edge deployment (low latency)
- Server Components (less JS)
- Code splitting (faster loads)
- Image optimization
- Font optimization (next/font)

## 🔧 Monitoring

### Metrics (Cloudflare Analytics)

- Request count
- Error rate
- Latency (p50, p95, p99)
- Cache hit rate

### Logs

```typescript
console.log("[Auth]", user);
console.error("[API]", error);
```

### Error Tracking

- Sentry (opcional)
- Cloudflare Logs

---

**Arquitetura atualizada em:** 2026-03-31
