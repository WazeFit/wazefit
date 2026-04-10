/**
 * WF-402 — Custom Domain per Tenant
 * 
 * POST   /api/v1/tenant/dominios          — Registrar domínio custom (expert only)
 * GET    /api/v1/tenant/dominios          — Listar domínios do tenant
 * DELETE /api/v1/tenant/dominios/:id      — Remover domínio
 * POST   /api/v1/tenant/dominios/:id/verificar — Verificar DNS
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { dominiosTenant } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const dominiosRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

dominiosRouter.use('*', authMiddleware, expertOnly)

// ── Schemas ──

const createDominioSchema = z.object({
  dominio: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Domínio inválido (ex: app.seudominio.com)'),
})

// ═══════════════════════════════════════════════════════════════
// POST /tenant/dominios — Registrar domínio custom
// ═══════════════════════════════════════════════════════════════
dominiosRouter.post('/', zValidator('json', createDominioSchema), async (c) => {
  const { dominio } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar se domínio já existe (global)
  const existing = await db
    .select({ id: dominiosTenant.id })
    .from(dominiosTenant)
    .where(and(eq(dominiosTenant.dominio, dominio), isNull(dominiosTenant.deletado_em)))
    .get()

  if (existing) {
    return c.json({ error: 'Domínio já cadastrado em outro tenant.', code: 409 }, 409)
  }

  const id = generateId()
  const timestamp = now()

  // Criar DNS record automaticamente no Cloudflare
  const ZONE_ID = '070a9f917db2f62e9a27e05dee1122b8' // wazefit.com zone
  const CF_API_TOKEN = c.env.CLOUDFLARE_API_TOKEN || ''

  let dnsRecordId: string | null = null
  let status: 'pending' | 'active' = 'pending'

  if (CF_API_TOKEN) {
    try {
      // Criar CNAME record apontando pro Pages
      const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: dominio,
          content: 'app.wazefit.com',
          proxied: true,
          ttl: 1, // Auto
        }),
      })

      const dnsData = await dnsRes.json() as { success: boolean; result?: { id: string } }

      if (dnsData.success && dnsData.result) {
        dnsRecordId = dnsData.result.id
        status = 'active' // DNS criado automaticamente
      }
    } catch (err) {
      console.error('Erro ao criar DNS record:', err)
      // Continua com status pending se falhar
    }
  }

  await db.insert(dominiosTenant).values({
    id,
    tenant_id: tenantId,
    dominio,
    status,
    ssl_status: status === 'active' ? 'active' : 'pending',
    verificado_em: status === 'active' ? timestamp : null,
    cloudflare_dns_id: dnsRecordId,
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  return c.json(
    {
      id,
      dominio,
      status,
      ssl_status: status === 'active' ? 'active' : 'pending',
      message: status === 'active' 
        ? 'Domínio configurado e ativo! Já pode acessar.' 
        : 'Domínio registrado. Aguardando propagação DNS.',
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /tenant/dominios — Listar domínios do tenant
// ═══════════════════════════════════════════════════════════════
dominiosRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const dominios = await db
    .select({
      id: dominiosTenant.id,
      dominio: dominiosTenant.dominio,
      status: dominiosTenant.status,
      verificado_em: dominiosTenant.verificado_em,
      ssl_status: dominiosTenant.ssl_status,
      criado_em: dominiosTenant.criado_em,
    })
    .from(dominiosTenant)
    .where(and(eq(dominiosTenant.tenant_id, tenantId), isNull(dominiosTenant.deletado_em)))

  return c.json({ data: dominios })
})

// ═══════════════════════════════════════════════════════════════
// DELETE /tenant/dominios/:id — Remover domínio
// ═══════════════════════════════════════════════════════════════
dominiosRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ 
      id: dominiosTenant.id,
      cloudflare_dns_id: dominiosTenant.cloudflare_dns_id,
    })
    .from(dominiosTenant)
    .where(
      and(
        eq(dominiosTenant.id, id),
        eq(dominiosTenant.tenant_id, tenantId),
        isNull(dominiosTenant.deletado_em),
      ),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Domínio não encontrado.', code: 404 }, 404)
  }

  // Remover DNS record do Cloudflare se existir
  if (existing.cloudflare_dns_id) {
    const ZONE_ID = '070a9f917db2f62e9a27e05dee1122b8'
    const CF_API_TOKEN = c.env.CLOUDFLARE_API_TOKEN || ''

    if (CF_API_TOKEN) {
      try {
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${existing.cloudflare_dns_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
            },
          }
        )
      } catch (err) {
        console.error('Erro ao remover DNS record:', err)
        // Continua mesmo se falhar
      }
    }
  }

  await db
    .update(dominiosTenant)
    .set({ deletado_em: now() })
    .where(eq(dominiosTenant.id, id))

  return c.json({ message: 'Domínio removido.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /tenant/dominios/:id/verificar — Verificar DNS
// ═══════════════════════════════════════════════════════════════
dominiosRouter.post('/:id/verificar', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const dominio = await db
    .select()
    .from(dominiosTenant)
    .where(
      and(
        eq(dominiosTenant.id, id),
        eq(dominiosTenant.tenant_id, tenantId),
        isNull(dominiosTenant.deletado_em),
      ),
    )
    .get()

  if (!dominio) {
    return c.json({ error: 'Domínio não encontrado.', code: 404 }, 404)
  }

  // Verificar DNS via DOH (DNS over HTTPS)
  try {
    const dnsUrl = `https://cloudflare-dns.com/dns-query?name=${dominio.dominio}&type=CNAME`
    const dnsResponse = await fetch(dnsUrl, {
      headers: { Accept: 'application/dns-json' },
    })

    const dnsData = await dnsResponse.json() as { Answer?: Array<{ data: string }> }
    const cnameTarget = dnsData.Answer?.[0]?.data

    if (cnameTarget && (cnameTarget === 'wazefit.com.' || cnameTarget.endsWith('.wazefit.com.'))) {
      await db
        .update(dominiosTenant)
        .set({
          status: 'active',
          verificado_em: now(),
          ssl_status: 'active',
          atualizado_em: now(),
        })
        .where(eq(dominiosTenant.id, id))

      return c.json({
        message: 'DNS verificado com sucesso!',
        status: 'active',
        cname_target: cnameTarget,
      })
    } else {
      await db
        .update(dominiosTenant)
        .set({ status: 'failed', atualizado_em: now() })
        .where(eq(dominiosTenant.id, id))

      return c.json(
        {
          error: 'CNAME não aponta para wazefit.com',
          status: 'failed',
          cname_encontrado: cnameTarget ?? null,
        },
        400,
      )
    }
  } catch (error) {
    await db
      .update(dominiosTenant)
      .set({ status: 'failed', atualizado_em: now() })
      .where(eq(dominiosTenant.id, id))

    return c.json(
      {
        error: 'Falha ao verificar DNS',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      500,
    )
  }
})

export { dominiosRouter }
