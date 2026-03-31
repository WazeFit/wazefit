# 🛠️ Comandos Úteis - WazeFit App

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Instalar dependência específica
npm install <package>

# Instalar dev dependency
npm install -D <package>
```

## 🚀 Desenvolvimento

```bash
# Rodar dev server (hot reload)
npm run dev

# Rodar em porta específica
PORT=3001 npm run dev

# Abrir automaticamente no browser
npm run dev -- --turbo
```

## 🏗️ Build

```bash
# Build para produção
npm run build

# Build + start
npm run build && npm start

# Verificar output
ls -lah .next/
```

## 🧪 Qualidade

```bash
# Type check (sem build)
npx tsc --noEmit

# Lint
npm run lint

# Lint + fix
npm run lint -- --fix

# Audit de segurança
npm audit

# Audit + fix
npm audit fix
```

## 🎨 shadcn/ui

```bash
# Adicionar componente
npx shadcn@latest add <component>

# Exemplos:
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add select
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add sheet

# Ver todos componentes disponíveis
npx shadcn@latest add
```

## 🧹 Limpeza

```bash
# Limpar build
rm -rf .next

# Limpar node_modules
rm -rf node_modules package-lock.json

# Limpar tudo e reinstalar
rm -rf .next node_modules package-lock.json && npm install
```

## 🔍 Debug

```bash
# Rodar com debug
NODE_OPTIONS='--inspect' npm run dev

# Ver variáveis de ambiente
npm run dev | grep -i env

# Build verbose
npm run build -- --debug
```

## 📊 Análise

```bash
# Analisar bundle
npm install -D @next/bundle-analyzer

# Adicionar no next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
# module.exports = withBundleAnalyzer(nextConfig)

# Rodar análise
ANALYZE=true npm run build
```

## 🚀 Deploy (Cloudflare)

```bash
# Instalar OpenNext
npm install -D open-next@latest

# Build com OpenNext
npm run build
npx open-next@latest build

# Verificar output
ls -lah .open-next/cloudflare/

# Deploy com wrangler
npm install -g wrangler
wrangler login
wrangler pages deploy .open-next/cloudflare --project-name wazefit-app
```

## 🔐 Variáveis de Ambiente

```bash
# Criar .env local
cp .env.example .env

# Editar
nano .env

# Verificar se está sendo lido
npm run dev | grep JWT_SECRET
```

## 📝 Git

```bash
# Inicializar repo
git init

# Adicionar tudo
git add .

# Commit
git commit -m "feat: initial commit - wazefit app"

# Adicionar remote
git remote add origin <url>

# Push
git push -u origin main
```

## 🧪 Testing (Opcional)

```bash
# Instalar Vitest
npm install -D vitest @vitejs/plugin-react

# Rodar testes
npm test

# Instalar Playwright
npm install -D @playwright/test
npx playwright install

# Rodar E2E
npx playwright test
```

## 🔧 Troubleshooting

```bash
# Erro de hydration
# → Adicionar suppressHydrationWarning no <html>

# Erro de build
# → Deletar .next e rebuildar
rm -rf .next && npm run build

# Erro de tipos
# → Rodar type check
npx tsc --noEmit

# Erro de dependências
# → Reinstalar
rm -rf node_modules package-lock.json && npm install

# Erro de cache
# → Limpar cache do Next.js
rm -rf .next/cache

# Erro de porta em uso
# → Matar processo
lsof -ti:3000 | xargs kill -9
# ou rodar em outra porta
PORT=3001 npm run dev
```

## 📦 Adicionar Features

### Gráficos (Recharts)

```bash
npm install recharts
```

```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';
```

### Gráficos (Tremor)

```bash
npm install @tremor/react
```

```tsx
import { Card, Title, BarChart } from '@tremor/react';
```

### Forms (React Hook Form)

```bash
npm install react-hook-form zod @hookform/resolvers
npx shadcn@latest add form
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

### Upload de Imagens

```bash
npm install react-dropzone
```

```tsx
import { useDropzone } from 'react-dropzone';
```

### Date Picker

```bash
npm install date-fns
npx shadcn@latest add calendar
npx shadcn@latest add popover
```

### Tabelas

```bash
npm install @tanstack/react-table
npx shadcn@latest add table
```

### Toast Notifications

```bash
npx shadcn@latest add toast
npx shadcn@latest add sonner
```

## 🎯 Atalhos Úteis

```bash
# Alias para comandos comuns (adicionar no ~/.bashrc)
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrs="npm run start"
alias nrl="npm run lint"

# Reload bash
source ~/.bashrc

# Agora pode usar:
nrd  # em vez de npm run dev
```

## 📚 Recursos

### Documentação
- Next.js: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind: https://tailwindcss.com
- TypeScript: https://www.typescriptlang.org

### Tools
- Next.js DevTools: https://nextjs.org/docs/app/building-your-application/optimizing/devtools
- React DevTools: Chrome extension
- Tailwind DevTools: https://tailwindcss.com/docs/editor-setup

### Generators
- shadcn theme builder: https://ui.shadcn.com/themes
- Tailwind color generator: https://uicolors.app
- Gradient generator: https://cssgradient.io

---

**Dica:** Salve este arquivo nos favoritos para consulta rápida! 📌
