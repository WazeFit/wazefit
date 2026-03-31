/**
 * Custom Domains API (nova versão usando custom_domains table)
 * 
 * GET    /api/v1/tenant/domains           — Listar domínios
 * POST   /api/v1/tenant/domains           — Adicionar domínio
 * DELETE /api/v1/tenant/domains/:id       — Remover domínio
 * POST   /api/v1/tenant/domains/:id/verify — Verificar DNS
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { customDomains, domainVerificationLogs, tenants } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'
import type { CustomDomainCreateInput, DomainVerificationResult, DNSRecord } from '../types/white-label'
import { DOMAIN_LIMITS } from '../types/white-label'

const domainsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

domainsRouter.use('*', authMiddleware, expertOnly)

// ── Schemas ──

const createDomainSchema = z.object({
  dominio: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Domínio inválido (ex: app.seudominio.com)'),
  tipo: z.enum(['custom', 'subdomain']).optional().default('custom'),
})

// ═══════════════════════════════════════════════════════════════
// GET /tenant/domains — Listar domínios
// ═══════════════════════════════════════════════════════════════
domainsRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const domains = await db
    .select({
      id: customDomains.id,
      dominio: customDomains.dominio,
      tipo: customDomains.tipo,
      status: customDomains.status,
      verificado: customDomains.verificado,
      verificado_em: customDomains.verificado_em,
      dns_configured: customDomains.dns_configured,
      dns_records_json: customDomains.dns_records_json,
      ssl_status: customDomains.ssl_status,
      ssl_emitido_em: customDomains.ssl_emitido_em,
      ssl_expira_em: customDomains.ssl_expira_em,
      erro: customDomains.erro,
      criado_em: customDomains.criado_em,
    })
    .from(customDomains)
    .where(and(eq(customDomains.tenant_id, tenantId), isNull(customDomains.deletado_em)))

  // Parse dns_records JSON
  const data = domains.map((d) => ({
    ...d,
    dns_records: JSON.parse(d.dns_records_json || '[]') as DNSRecord[],
    dns_records_json: undefined,
  }))

  return c.json({ data })
})

// ═══════════════════════════════════════════════════════════════
// POST /tenant/domains — Adicionar domínio
// ═══════════════════════════════════════════════════════════════
domainsRouter.post('/', zValidator('json', createDomainSchema), async (c) => {
  const input = c.req.valid('json') as CustomDomainCreateInput
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar plano e limite
  const tenant = await db
    .select({ plano: tenants.plano })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .get()

  if (!tenant) {
    return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)
  }

  const limit = DOMAIN_LIMITS[tenant.plano] || 0

  if (limit === 0) {
    return c.json(
      {
        error: 'Domínios customizados não disponíveis no seu plano.',
        code: 403,
      },
      403,
    )
  }

  // Contar domínios ativos
  const count = await db
    .select({ count: customDomains.id })
    .from(customDomains)
    .where(and(eq(customDomains.tenant_id, tenantId), isNull(customDomains.deletado_em)))
    .all()

  if (count.length >= limit) {
    return c.json(
      {
        error: `Limite de ${limit} domínio(s) atingido para o plano ${tenant.plano}.`,
        code: 403,
      },
      403,
    )
  }

  // Verificar se domínio já existe (global)
  const existing = await db
    .select({ id: customDomains.id })
    .from(customDomains)
    .where(and(eq(customDomains.dominio, input.dominio), isNull(customDomains.deletado_em)))
    .get()

  if (existing) {
    return c.json(
      {
        error: 'Domínio já cadastrado em outro tenant.',
        code: 409,
      },
      409,
    )
  }

  // Gerar validation token
  const validationToken = `wazefit-verify-${generateId()}`

  // DNS records esperados
  // CNAME aponta para wazefit.com (fallback origin do Cloudflare for SaaS)
  const dnsRecords: DNSRecord[] = [
    {
      type: 'CNAME',
      name: input.dominio,
      value: 'wazefit.com',
      ttl: 3600,
    },
    {
      type: 'TXT',
      name: `_wazefit-verify.${input.dominio}`,
      value: validationToken,
      ttl: 3600,
    },
  ]

  const id = generateId()
  const timestamp = now()

  await db.insert(customDomains).values({
    id,
    tenant_id: tenantId,
    dominio: input.dominio,
    tipo: input.tipo || 'custom',
    status: 'pending',
    verificado: false,
    dns_configured: false,
    dns_records_json: JSON.stringify(dnsRecords),
    ssl_status: 'pending',
    validation_token: validationToken,
    validation_attempts: 0,
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  return c.json(
    {
      id,
      dominio: input.dominio,
      status: 'pending',
      dns_records: dnsRecords,
      validation_token: validationToken,
      message: 'Domínio registrado. Configure os DNS records abaixo e clique em "Verificar".',
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// POST /tenant/domains/:id/verify — Verificar DNS
// ═══════════════════════════════════════════════════════════════
domainsRouter.post('/:id/verify', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const domain = await db
    .select()
    .from(customDomains)
    .where(
      and(
        eq(customDomains.id, id),
        eq(customDomains.tenant_id, tenantId),
        isNull(customDomains.deletado_em),
      ),
    )
    .get()

  if (!domain) {
    return c.json({ error: 'Domínio não encontrado.', code: 404 }, 404)
  }

  const result: DomainVerificationResult = {
    success: false,
    dns_configured: false,
    ssl_ready: false,
    errors: [],
  }

  const logId = generateId()
  const timestamp = now()

  try {
    // 1. Verificar CNAME
    const cnameUrl = `https://cloudflare-dns.com/dns-query?name=${domain.dominio}&type=CNAME`
    const cnameRes = await fetch(cnameUrl, {
      headers: { Accept: 'application/dns-json' },
    })
    const cnameData = await cnameRes.json() as { Answer?: Array<{ data: string }> }
    const cnameTarget = cnameData.Answer?.[0]?.data

    if (!cnameTarget || !cnameTarget.includes('wazefit')) {
      result.errors?.push('CNAME não aponta para wazefit.pages.dev')
    } else {
      result.dns_configured = true
    }

    // 2. Verificar TXT (validation token)
    const txtUrl = `https://cloudflare-dns.com/dns-query?name=_wazefit-verify.${domain.dominio}&type=TXT`
    const txtRes = await fetch(txtUrl, {
      headers: { Accept: 'application/dns-json' },
    })
    const txtData = await txtRes.json() as { Answer?: Array<{ data: string }> }
    const txtValue = txtData.Answer?.[0]?.data?.replace(/"/g, '')

    if (txtValue !== domain.validation_token) {
      result.errors?.push('TXT record de validação não encontrado ou incorreto')
    }

    // Se ambos OK, marcar como verificado e registrar no Cloudflare Pages
    if (result.dns_configured && !result.errors?.length) {
      result.success = true
      result.ssl_ready = true

      // ── Registrar domínio no Cloudflare Pages ──
      let pagesRegistered = false
      const cfApiToken = c.env.CLOUDFLARE_API_TOKEN
      const cfAccountId = c.env.CLOUDFLARE_ACCOUNT_ID || '2529853c8c5ed14c04e8ede995caaea6'
      const cfPagesProject = c.env.CLOUDFLARE_PAGES_PROJECT || 'wazefit'

      if (cfApiToken) {
        try {
          const pagesRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects/${cfPagesProject}/domains`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${cfApiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: domain.dominio }),
            },
          )
          const pagesData = await pagesRes.json() as { success: boolean; errors?: Array<{ code: number; message: string }> }
          
          if (pagesData.success) {
            pagesRegistered = true
          } else {
            // Domínio pode já existir no Pages (409) — tratar como sucesso
            const alreadyExists = pagesData.errors?.some((e) => e.code === 8000009)
            if (alreadyExists) {
              pagesRegistered = true
            } else {
              console.error('Pages domain registration failed:', JSON.stringify(pagesData.errors))
            }
          }
        } catch (pagesErr) {
          console.error('Pages API error:', pagesErr)
        }
      }

      await db
        .update(customDomains)
        .set({
          status: pagesRegistered ? 'active' : 'provisioning',
          verificado: true,
          verificado_em: timestamp,
          dns_configured: true,
          ssl_status: pagesRegistered ? 'provisioning' : 'pending',
          erro: pagesRegistered ? null : 'DNS verificado, aguardando provisionamento no Cloudflare Pages',
          validation_attempts: (domain.validation_attempts || 0) + 1,
          last_validation_at: timestamp,
          atualizado_em: timestamp,
        })
        .where(eq(customDomains.id, id))

      // Log sucesso
      await db.insert(domainVerificationLogs).values({
        id: logId,
        domain_id: id,
        tenant_id: tenantId,
        tipo: 'dns',
        sucesso: true,
        detalhes_json: JSON.stringify({ cname: cnameTarget, txt: txtValue, pagesRegistered }),
        criado_em: timestamp,
      })

      return c.json({
        ...result,
        pagesRegistered,
        message: pagesRegistered
          ? 'Domínio verificado e registrado! SSL será provisionado automaticamente em ~1 minuto.'
          : 'DNS verificado! Domínio será ativado em breve.',
      })
    } else {
      // Falha
      await db
        .update(customDomains)
        .set({
          status: 'failed',
          erro: result.errors?.join('; '),
          validation_attempts: (domain.validation_attempts || 0) + 1,
          last_validation_at: timestamp,
          atualizado_em: timestamp,
        })
        .where(eq(customDomains.id, id))

      // Log falha
      await db.insert(domainVerificationLogs).values({
        id: logId,
        domain_id: id,
        tenant_id: tenantId,
        tipo: 'dns',
        sucesso: false,
        erro: result.errors?.join('; '),
        detalhes_json: JSON.stringify({ cname: cnameTarget, txt: txtValue }),
        criado_em: timestamp,
      })

      return c.json(result, 400)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'

    await db
      .update(customDomains)
      .set({
        status: 'failed',
        erro: errorMsg,
        validation_attempts: (domain.validation_attempts || 0) + 1,
        last_validation_at: timestamp,
        atualizado_em: timestamp,
      })
      .where(eq(customDomains.id, id))

    await db.insert(domainVerificationLogs).values({
      id: logId,
      domain_id: id,
      tenant_id: tenantId,
      tipo: 'dns',
      sucesso: false,
      erro: errorMsg,
      criado_em: timestamp,
    })

    return c.json(
      {
        ...result,
        errors: [errorMsg],
      },
      500,
    )
  }
})

// ═══════════════════════════════════════════════════════════════
// DELETE /tenant/domains/:id — Remover domínio
// ═══════════════════════════════════════════════════════════════
domainsRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: customDomains.id })
    .from(customDomains)
    .where(
      and(
        eq(customDomains.id, id),
        eq(customDomains.tenant_id, tenantId),
        isNull(customDomains.deletado_em),
      ),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Domínio não encontrado.', code: 404 }, 404)
  }

  // Buscar o domínio completo para saber o hostname
  const domainToDelete = await db
    .select({ dominio: customDomains.dominio })
    .from(customDomains)
    .where(eq(customDomains.id, id))
    .get()

  // Soft delete no banco
  await db
    .update(customDomains)
    .set({ deletado_em: now() })
    .where(eq(customDomains.id, id))

  // ── Remover do Cloudflare Pages ──
  const cfApiToken = c.env.CLOUDFLARE_API_TOKEN
  const cfAccountId = c.env.CLOUDFLARE_ACCOUNT_ID || '2529853c8c5ed14c04e8ede995caaea6'
  const cfPagesProject = c.env.CLOUDFLARE_PAGES_PROJECT || 'wazefit'

  if (cfApiToken && domainToDelete?.dominio) {
    try {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects/${cfPagesProject}/domains/${domainToDelete.dominio}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${cfApiToken}` },
        },
      )
    } catch (err) {
      console.error('Failed to remove domain from Pages:', err)
    }
  }

  return c.json({ message: 'Domínio removido.' })
})

export { domainsRouter }
