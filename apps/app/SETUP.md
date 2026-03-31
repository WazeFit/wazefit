# Setup Guide - WazeFit App

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd apps/app
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` se necessário (opcional para desenvolvimento).

### 3. Rodar Dev Server

```bash
npm run dev
```

Abra http://localhost:3000

### 4. Login de Teste

**Expert (Admin):**
- Email: `expert@wazefit.com`
- Senha: qualquer coisa

**User (Cliente):**
- Email: `user@wazefit.com`
- Senha: qualquer coisa

## 📦 Adicionar Componentes shadcn/ui

Para adicionar novos componentes:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add select
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add toast
```

Componentes disponíveis: https://ui.shadcn.com/docs/components

## 🎨 Customizar Tema

Edite `app/globals.css` para ajustar cores:

```css
:root {
  --primary: 240 5.9% 10%;      /* Cor primária */
  --secondary: 240 4.8% 95.9%;  /* Cor secundária */
  /* ... */
}
```

Ou use o theme builder: https://ui.shadcn.com/themes

## 🏗️ Build para Produção

### Build Next.js

```bash
npm run build
```

### Build com OpenNext (Cloudflare)

```bash
# Instalar OpenNext
npm install -D open-next@latest

# Build
npm run build
npx open-next@latest build

# Output em .open-next/cloudflare/
```

## 🚀 Deploy Cloudflare Pages

### Opção 1: Via Dashboard

1. Acesse Cloudflare Pages
2. Conecte seu repositório GitHub
3. Configure:
   - Build command: `npm run build && npx open-next@latest build`
   - Build output: `.open-next/cloudflare`
   - Environment variables: `JWT_SECRET`, `NEXT_PUBLIC_API_URL`

### Opção 2: Via Wrangler CLI

```bash
# Instalar Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
npm run build
npx open-next@latest build
wrangler pages deploy .open-next/cloudflare --project-name wazefit-app
```

## 🔗 Integrar com API Real

Edite `app/api/auth/login/route.ts`:

```typescript
// Descomentar e configurar:
const response = await fetch("https://api.wazefit.com/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();
// ...
```

Edite `lib/tenant.ts`:

```typescript
export async function getTenant(): Promise<TenantConfig> {
  const host = headers().get("host") || "";
  
  // Descomentar:
  const response = await fetch(`https://api.wazefit.com/tenants/by-domain/${host}`);
  const tenant = await response.json();
  return tenant;
}
```

## 🧪 Testing

### Adicionar Vitest (Unit Tests)

```bash
npm install -D vitest @vitejs/plugin-react
```

### Adicionar Playwright (E2E Tests)

```bash
npm install -D @playwright/test
npx playwright install
```

## 📝 Estrutura de Dados

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "expert" | "user";
  tenantId: string;
}
```

### TenantConfig

```typescript
interface TenantConfig {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;    // HSL: "240 5.9% 10%"
  secondaryColor: string;
  domain: string;
}
```

## 🐛 Troubleshooting

### Erro de hydration

- Verifique se componentes client (`"use client"`) não estão usando dados server-side
- Use `suppressHydrationWarning` no `<html>` para theme

### Erro de autenticação

- Limpe cookies: DevTools → Application → Cookies → Delete
- Verifique `JWT_SECRET` no `.env`

### Build falha

- Delete `.next` e `node_modules`
- `npm install` novamente
- Verifique versão do Node (>=18)

## 🔧 Scripts Úteis

```bash
# Dev
npm run dev

# Build
npm run build

# Start production
npm run start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## 📚 Recursos

- [Next.js 15 Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [OpenNext](https://opennext.js.org)
- [Cloudflare Pages](https://pages.cloudflare.com)

---

**Dúvidas?** Consulte o README.md principal.
