import { cors } from 'hono/cors'

/**
 * Middleware CORS — permite origens do frontend WazeFit.
 *
 * Em producao SO existe wazefit.com (e seus subdominios white label).
 * Os hosts *.pages.dev sao backends internos consumidos via proxy
 * (tenant-proxy worker), nao deveriam ser acessados direto pelo browser.
 *
 * Mesmo assim aceitamos:
 * - wazefit.pages.dev      (landing — em caso de fallback)
 * - wazefit-tenant.pages.dev (painel — em caso de fallback)
 * - previews abc123.wazefit-tenant.pages.dev
 *
 * NAO aceitamos mais wazefit-app.pages.dev — projeto deletado em 2026-04.
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return '*'

    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8787',
      'https://wazefit.com',
      'https://www.wazefit.com',
    ]
    if (allowed.includes(origin)) return origin

    let host: string
    try {
      host = new URL(origin).hostname
    } catch {
      return null
    }

    // Apex e subdominios de wazefit.com — white label dos experts
    if (host === 'wazefit.com' || host.endsWith('.wazefit.com')) return origin

    // Backends internos legitimos (Pages projects ativos)
    if (host === 'wazefit.pages.dev') return origin
    if (host === 'wazefit-tenant.pages.dev' || host.endsWith('.wazefit-tenant.pages.dev')) return origin

    return null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400,
})
