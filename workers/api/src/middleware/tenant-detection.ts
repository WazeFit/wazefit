/**
 * Middleware: Tenant Detection por Domínio Customizado
 * 
 * Detecta o tenant_id baseado no domínio da requisição.
 * 
 * Ordem de prioridade:
 * 1. Header Authorization (JWT) — tenant_id do token
 * 2. Custom domain — busca na tabela custom_domains
 * 3. Subdomain *.wazefit.com — extrai do hostname
 * 4. Fallback — retorna null (usar em rotas públicas)
 * 
 * Adiciona à context:
 * - tenant_id: string | null
 * - tenant_domain: string | null
 * - tenant_source: 'jwt' | 'custom_domain' | 'subdomain' | 'default'
 */
import type { Context, Next } from 'hono'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { customDomains } from '../db/schema'

export const tenantDetectionMiddleware = async (
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next,
) => {
  let tenantId: string | null = null
  let tenantDomain: string | null = null
  let tenantSource: 'jwt' | 'custom_domain' | 'subdomain' | 'default' = 'default'

  // 1. Verificar JWT (se já passou por authMiddleware)
  const existingTenantId = c.get('tenant_id')
  if (existingTenantId) {
    tenantId = existingTenantId
    tenantSource = 'jwt'
  } else {
    // 2. Verificar domínio customizado
    const url = new URL(c.req.url)
    const hostname = url.hostname

    // Ignorar localhost e IPs
    if (hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const db = createDB(c.env.DB)

      // Buscar custom domain ativo
      const domain = await db
        .select({ tenant_id: customDomains.tenant_id })
        .from(customDomains)
        .where(
          and(
            eq(customDomains.dominio, hostname),
            eq(customDomains.status, 'active'),
            eq(customDomains.verificado, true),
            isNull(customDomains.deletado_em),
          ),
        )
        .get()

      if (domain) {
        tenantId = domain.tenant_id
        tenantDomain = hostname
        tenantSource = 'custom_domain'
      } else if (hostname.endsWith('.wazefit.com') && hostname !== 'wazefit.com') {
        // 3. Subdomain *.wazefit.com
        // Buscar tenant por slug (assumindo slug = subdomain)
        // Nota: precisa de uma query adicional em tenants
        // Por ora, apenas registra o subdomain
        tenantDomain = hostname
        tenantSource = 'subdomain'
        // tenantId ainda null — precisa implementar lookup por slug
      }
    }
  }

  // Adicionar à context
  c.set('tenant_id', tenantId || '')
  c.set('tenant_domain', tenantDomain)
  c.set('tenant_source', tenantSource)

  await next()
}
