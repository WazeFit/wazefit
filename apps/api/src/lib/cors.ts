/**
 * CORS Helper — gerencia origins permitidas (wazefit.com + domínios custom)
 */

export interface CorsOptions {
  origin: string
  methods?: string
  headers?: string
  credentials?: boolean
}

/**
 * Origins permitidas (base)
 * - wazefit.com (produção)
 * - localhost:5173 (dev)
 * - *.wazefit.com (subdomínios de experts)
 */
const BASE_ALLOWED_ORIGINS = [
  'https://wazefit.com',
  'https://www.wazefit.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

/**
 * Verifica se origin é permitida
 * - Exact match em BASE_ALLOWED_ORIGINS
 * - Pattern match para *.wazefit.com
 * - Custom domains (verificados no D1)
 */
export function isOriginAllowed(origin: string | null, customDomains: string[] = []): boolean {
  if (!origin) return false

  // Exact match
  if (BASE_ALLOWED_ORIGINS.includes(origin)) return true

  // Wildcard *.wazefit.com
  if (origin.match(/^https:\/\/[a-z0-9-]+\.wazefit\.com$/)) return true

  // Custom domains (ex: https://app.minhaacademia.com)
  if (customDomains.some(d => origin === `https://${d}`)) return true

  return false
}

/**
 * Retorna headers CORS para a response
 */
export function getCorsHeaders(request: Request, customDomains: string[] = []): Record<string, string> {
  const origin = request.headers.get('Origin')

  if (!isOriginAllowed(origin, customDomains)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Middleware CORS — adiciona headers automaticamente
 */
export function withCors(
  handler: (request: Request) => Promise<Response>,
  customDomains: string[] = [],
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    // Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, customDomains),
      })
    }

    // Request normal
    const response = await handler(request)

    // Adiciona CORS headers
    const corsHeaders = getCorsHeaders(request, customDomains)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Helper para buscar domínios custom do tenant (D1)
 * Usado em middleware para validar CORS dinamicamente
 */
export async function getTenantCustomDomains(db: D1Database, tenantId: number): Promise<string[]> {
  const result = await db
    .prepare('SELECT dominio FROM dominios_tenant WHERE tenant_id = ? AND status = ?')
    .bind(tenantId, 'active')
    .all<{ dominio: string }>()

  return result.results?.map(r => r.dominio) || []
}
