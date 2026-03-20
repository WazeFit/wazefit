import { cors } from 'hono/cors'

/**
 * Middleware CORS — permite origens do frontend WazeFit.
 * Em dev aceita localhost, em prod aceita *.wazefit.com e *.pages.dev.
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return '*'

    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8787',
      'https://wazefit.pages.dev',
      'https://wazefit.com',
      'https://app.wazefit.com',
    ]

    // Permitir qualquer subdomínio de wazefit.com (white label)
    if (origin.endsWith('.wazefit.com')) return origin
    // Permitir previews do Cloudflare Pages
    if (origin.endsWith('.wazefit.pages.dev')) return origin
    // Permitir origens fixas
    if (allowed.includes(origin)) return origin

    return null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400,
})
