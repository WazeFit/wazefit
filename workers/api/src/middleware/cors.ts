import { cors } from 'hono/cors'

/**
 * Middleware CORS — permite origens do frontend WazeFit.
 * Aceita: wazefit.com (+ qualquer subdominio white label), localhost dev,
 * e qualquer projeto/preview Pages cujo host comece com "wazefit"
 * (wazefit.pages.dev, wazefit-tenant.pages.dev, wazefit-app.pages.dev,
 * abc123.wazefit-tenant.pages.dev, etc.).
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
      'https://app.wazefit.com',
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

    // Qualquer projeto/preview Cloudflare Pages que comece com "wazefit"
    if (/^([a-z0-9-]+\.)?wazefit[a-z0-9-]*\.pages\.dev$/.test(host)) return origin

    return null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400,
})
