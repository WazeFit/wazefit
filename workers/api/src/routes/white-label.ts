/**
 * White Label Settings API
 * 
 * GET    /api/v1/tenant/white-label          — Buscar settings do tenant
 * PUT    /api/v1/tenant/white-label          — Atualizar settings
 * POST   /api/v1/tenant/white-label/logo     — Upload logo
 * POST   /api/v1/tenant/white-label/favicon  — Upload favicon
 * DELETE /api/v1/tenant/white-label/logo     — Remover logo
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { whiteLabelSettings, tenants } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'
import type { WhiteLabelUpdateInput } from '../types/white-label'

const whiteLabelRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

whiteLabelRouter.use('*', authMiddleware, expertOnly)

// ── Schemas ──

const updateWhiteLabelSchema = z.object({
  // Cores
  cor_primaria: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  cor_secundaria: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  cor_acento: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  cor_fundo: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  cor_texto: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  
  // Textos
  nome_app: z.string().max(100).optional(),
  slogan: z.string().max(200).optional(),
  email_suporte: z.string().email().optional(),
  telefone_suporte: z.string().max(20).optional(),
  
  // SEO
  meta_titulo: z.string().max(60).optional(),
  meta_descricao: z.string().max(160).optional(),
  meta_keywords: z.string().max(200).optional(),
  
  // Social
  facebook_url: z.string().url().optional(),
  instagram_url: z.string().url().optional(),
  twitter_url: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  youtube_url: z.string().url().optional(),
  
  // Config
  ocultar_marca_wazefit: z.boolean().optional(),
  custom_css: z.string().max(10000).optional(),
  custom_js: z.string().max(10000).optional(),
})

// ═══════════════════════════════════════════════════════════════
// GET /tenant/white-label — Buscar settings
// ═══════════════════════════════════════════════════════════════
whiteLabelRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  let settings = await db
    .select()
    .from(whiteLabelSettings)
    .where(eq(whiteLabelSettings.tenant_id, tenantId))
    .get()

  // Se não existir, criar com valores padrão
  if (!settings) {
    const tenant = await db
      .select({ nome: tenants.nome, email: tenants.email })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .get()

    const id = generateId()
    const timestamp = now()

    await db.insert(whiteLabelSettings).values({
      id,
      tenant_id: tenantId,
      nome_app: tenant?.nome,
      email_suporte: tenant?.email,
      criado_em: timestamp,
      atualizado_em: timestamp,
    })

    settings = await db
      .select()
      .from(whiteLabelSettings)
      .where(eq(whiteLabelSettings.tenant_id, tenantId))
      .get()
  }

  return c.json({ data: settings })
})

// ═══════════════════════════════════════════════════════════════
// PUT /tenant/white-label — Atualizar settings
// ═══════════════════════════════════════════════════════════════
whiteLabelRouter.put('/', zValidator('json', updateWhiteLabelSchema), async (c) => {
  const input = c.req.valid('json') as WhiteLabelUpdateInput
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar plano para ocultar_marca_wazefit
  if (input.ocultar_marca_wazefit !== undefined) {
    const tenant = await db
      .select({ plano: tenants.plano })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .get()

    if (tenant?.plano !== 'enterprise' && input.ocultar_marca_wazefit === true) {
      return c.json(
        {
          error: 'Ocultar marca WazeFit disponível apenas no plano Enterprise.',
          code: 403,
        },
        403,
      )
    }
  }

  // Verificar se existe
  const existing = await db
    .select({ id: whiteLabelSettings.id })
    .from(whiteLabelSettings)
    .where(eq(whiteLabelSettings.tenant_id, tenantId))
    .get()

  if (!existing) {
    return c.json({ error: 'Settings não encontrados. Use GET primeiro.', code: 404 }, 404)
  }

  await db
    .update(whiteLabelSettings)
    .set({
      ...input,
      atualizado_em: now(),
    })
    .where(eq(whiteLabelSettings.tenant_id, tenantId))

  const updated = await db
    .select()
    .from(whiteLabelSettings)
    .where(eq(whiteLabelSettings.tenant_id, tenantId))
    .get()

  return c.json({ data: updated })
})

// ═══════════════════════════════════════════════════════════════
// POST /tenant/white-label/logo — Upload logo
// ═══════════════════════════════════════════════════════════════
whiteLabelRouter.post('/logo', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Parse multipart/form-data
  const formData = await c.req.formData()
  const file = formData.get('logo') as File | null

  if (!file) {
    return c.json({ error: 'Campo "logo" obrigatório (multipart/form-data).', code: 400 }, 400)
  }

  // Validar tipo
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return c.json(
      {
        error: 'Tipo de arquivo inválido. Use PNG, JPEG, WebP ou SVG.',
        code: 400,
      },
      400,
    )
  }

  // Validar tamanho (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return c.json({ error: 'Arquivo muito grande. Máximo 2MB.', code: 400 }, 400)
  }

  // Upload para R2
  const filename = `white-label/${tenantId}/logo-${Date.now()}.${file.type.split('/')[1]}`
  const buffer = await file.arrayBuffer()

  await c.env.R2_BUCKET.put(filename, buffer, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  // Gerar URL público
  const logoUrl = `${c.env.R2_PUBLIC_URL}/${filename}`

  // Atualizar no banco
  await db
    .update(whiteLabelSettings)
    .set({
      logo_url: logoUrl,
      atualizado_em: now(),
    })
    .where(eq(whiteLabelSettings.tenant_id, tenantId))

  return c.json({ logo_url: logoUrl })
})

// ═══════════════════════════════════════════════════════════════
// POST /tenant/white-label/favicon — Upload favicon
// ═══════════════════════════════════════════════════════════════
whiteLabelRouter.post('/favicon', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const formData = await c.req.formData()
  const file = formData.get('favicon') as File | null

  if (!file) {
    return c.json({ error: 'Campo "favicon" obrigatório.', code: 400 }, 400)
  }

  // Validar tipo (favicon = .ico ou .png pequeno)
  const allowedTypes = ['image/x-icon', 'image/png', 'image/vnd.microsoft.icon']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Use arquivo .ico ou .png para favicon.', code: 400 }, 400)
  }

  // Validar tamanho (500KB max)
  if (file.size > 500 * 1024) {
    return c.json({ error: 'Favicon muito grande. Máximo 500KB.', code: 400 }, 400)
  }

  const filename = `white-label/${tenantId}/favicon-${Date.now()}.${file.type.split('/')[1]}`
  const buffer = await file.arrayBuffer()

  await c.env.R2_BUCKET.put(filename, buffer, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  const faviconUrl = `${c.env.R2_PUBLIC_URL}/${filename}`

  await db
    .update(whiteLabelSettings)
    .set({
      favicon_url: faviconUrl,
      atualizado_em: now(),
    })
    .where(eq(whiteLabelSettings.tenant_id, tenantId))

  return c.json({ favicon_url: faviconUrl })
})

// ═══════════════════════════════════════════════════════════════
// DELETE /tenant/white-label/logo — Remover logo
// ═══════════════════════════════════════════════════════════════
whiteLabelRouter.delete('/logo', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const settings = await db
    .select({ logo_url: whiteLabelSettings.logo_url })
    .from(whiteLabelSettings)
    .where(eq(whiteLabelSettings.tenant_id, tenantId))
    .get()

  if (settings?.logo_url) {
    // Extrair filename do URL
    const filename = settings.logo_url.split('/').slice(-3).join('/')

    try {
      await c.env.R2_BUCKET.delete(filename)
    } catch (err) {
      console.error('Erro ao deletar do R2:', err)
      // Continua mesmo se falhar
    }
  }

  await db
    .update(whiteLabelSettings)
    .set({
      logo_url: null,
      atualizado_em: now(),
    })
    .where(eq(whiteLabelSettings.tenant_id, tenantId))

  return c.json({ message: 'Logo removido.' })
})

export { whiteLabelRouter }
