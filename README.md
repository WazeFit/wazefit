# WazeFit

SaaS white label para nicho fitness. Plataforma completa para personal trainers e nutricionistas gerenciarem alunos, treinos, nutrição e cobranças.

## Stack

- **Backend:** Cloudflare Workers + Hono.js + D1 + R2 + KV + Queues
- **Frontend:** React 19 + Vite + Tailwind CSS + TanStack Router/Query
- **IA:** Anthropic Claude (geração de treinos e dietas)
- **Pagamentos:** Stripe
- **Mobile:** React Native + Expo (futuro)

## Estrutura

```
wazefit/
├── apps/
│   └── web/              # Frontend React (Cloudflare Pages)
├── workers/
│   └── api/              # API principal (Cloudflare Workers)
├── packages/             # Libs compartilhadas (futuro)
├── .github/workflows/    # CI/CD (GitHub Actions)
├── tsconfig.base.json    # TypeScript config compartilhado
├── eslint.config.js      # ESLint config
└── .prettierrc           # Prettier config
```

## Setup

```bash
# Instalar dependências
pnpm install

# Rodar frontend (localhost:5173)
pnpm dev

# Rodar API (localhost:8787)
pnpm dev:api

# Rodar tudo em paralelo
pnpm dev:all

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

## Deploy

Push na `main` dispara deploy automático via GitHub Actions:
- **API** → Cloudflare Workers
- **Frontend** → Cloudflare Pages

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha os valores.
Para o Worker API, crie `workers/api/.dev.vars` com os secrets.
