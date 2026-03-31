/**
 * Public API — Endpoints sem autenticação
 * 
 * GET /api/v1/public/white-label — Buscar white label settings por domínio
 */
import { Hono } from 'hono'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env } from '../types'
import { createDB } from '../db/client'
import { customDomains, whiteLabelSettings, tenants } from '../db/schema'

const publicRouter = new Hono<{ Bindings: Env }>()

// ═══════════════════════════════════════════════════════════════
// GET /public/white-label — Buscar white label por domínio
// ═══════════════════════════════════════════════════════════════
publicRouter.get('/white-label', async (c) => {
  const url = new URL(c.req.url)
  const hostname = url.hostname
  const db = createDB(c.env.DB)

  let tenantId: string | null = null

  // 1. Tentar buscar por custom domain
  if (hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
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
    } else if (hostname.endsWith('.wazefit.com') && hostname !== 'wazefit.com') {
      // 2. Buscar por subdomain (slug)
      const subdomain = hostname.replace('.wazefit.com', '')
      
      const tenant = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, subdomain))
        .get()

      if (tenant) {
        tenantId = tenant.id
      }
    }
  }

  // Se não encontrou tenant, retornar settings padrão WazeFit
  if (!tenantId) {
    return c.json({
      data: {
        nome_app: 'WazeFit',
        cor_primaria: '#22c55e',
        cor_secundaria: '#16a34a',
        cor_acento: '#059669',
        cor_fundo: '#ffffff',
        cor_texto: '#1f2937',
        ocultar_marca_wazefit: false,
      },
    })
  }

  // Buscar white label settings do tenant
  const settings = await db
    .select({
      logo_url: whiteLabelSettings.logo_url,
      logo_small_url: whiteLabelSettings.logo_small_url,
      favicon_url: whiteLabelSettings.favicon_url,
      cor_primaria: whiteLabelSettings.cor_primaria,
      cor_secundaria: whiteLabelSettings.cor_secundaria,
      cor_acento: whiteLabelSettings.cor_acento,
      cor_fundo: whiteLabelSettings.cor_fundo,
      cor_texto: whiteLabelSettings.cor_texto,
      nome_app: whiteLabelSettings.nome_app,
      slogan: whiteLabelSettings.slogan,
      meta_titulo: whiteLabelSettings.meta_titulo,
      meta_descricao: whiteLabelSettings.meta_descricao,
      ocultar_marca_wazefit: whiteLabelSettings.ocultar_marca_wazefit,
      custom_css: whiteLabelSettings.custom_css,
    })
    .from(whiteLabelSettings)
    .where(eq(whiteLabelSettings.tenant_id, tenantId))
    .get()

  // Se não existe, retornar padrão do tenant
  if (!settings) {
    const tenant = await db
      .select({ nome: tenants.nome })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .get()

    return c.json({
      data: {
        nome_app: tenant?.nome || 'WazeFit',
        cor_primaria: '#22c55e',
        cor_secundaria: '#16a34a',
        cor_acento: '#059669',
        cor_fundo: '#ffffff',
        cor_texto: '#1f2937',
        ocultar_marca_wazefit: false,
      },
    })
  }

  return c.json({ data: settings })
})

export { publicRouter }
