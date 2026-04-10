/**
 * Rotas de configuração do tenant (white label).
 *
 * GET  /api/v1/tenant/config           — Retornar configurações (auth)
 * PUT  /api/v1/tenant/config           — Atualizar configurações (expert only)
 * POST /api/v1/tenant/branding/upload  — Upload logo/favicon para R2 (expert only)
 * GET  /api/v1/tenant/branding         — Branding público (sem auth, para PWA)
 * GET  /api/v1/tenant/branding-by-host — Branding público por hostname (sem auth)
 * GET  /api/v1/tenant/lookup           — Lookup domínio → slug
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { tenantConfig, tenants, dominiosTenant } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const tenantRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// ── Upload branding (logo / favicon) para R2 ──

const MAX_LOGO_SIZE = 2 * 1024 * 1024   // 2 MB
const MAX_FAVICON_SIZE = 512 * 1024       // 512 KB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']

// POST /tenant/branding/upload — Upload logo ou favicon para R2 (expert only)
tenantRouter.post('/branding/upload', authMiddleware, expertOnly, async (c) => {
  const tenantId = c.get('tenant_id')

  if (!c.env.R2_PRIVATE) {
    return c.json({ error: 'Storage não configurado.', code: 503 }, 503)
  }

  const formData = await c.req.formData()
  const tipo = formData.get('tipo') as string | null // 'logo' ou 'favicon'
  const file = formData.get('file') as File | null

  if (!tipo || !['logo', 'favicon'].includes(tipo)) {
    return c.json({ error: 'Tipo deve ser "logo" ou "favicon".', code: 400 }, 400)
  }

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'Arquivo não enviado.', code: 400 }, 400)
  }

  // Validar content type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return c.json({ error: `Tipo de arquivo não permitido: ${file.type}`, code: 400 }, 400)
  }

  // Validar tamanho
  const maxSize = tipo === 'logo' ? MAX_LOGO_SIZE : MAX_FAVICON_SIZE
  if (file.size > maxSize) {
    return c.json({
      error: `Arquivo muito grande. Máximo: ${tipo === 'logo' ? '2MB' : '512KB'}`,
      code: 413,
    }, 413)
  }

  // Gerar key e upload para R2
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const fileId = generateId()
  const key = `${tenantId}/branding/${tipo}-${fileId}.${ext}`

  const buffer = await file.arrayBuffer()
  await c.env.R2_PRIVATE.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  })

  // Construir URL absoluta (via media proxy publico)
  const reqUrl = new URL(c.req.url)
  const publicUrl = `${reqUrl.protocol}//${reqUrl.host}/api/v1/media/file/${key}`

  // Salvar na tenant_config
  const db = createDB(c.env.DB)
  const chave = tipo === 'logo' ? 'logo_url' : 'favicon_url'
  const timestamp = now()

  const existing = await db.select({ id: tenantConfig.id }).from(tenantConfig)
    .where(and(eq(tenantConfig.tenant_id, tenantId), eq(tenantConfig.chave, chave))).get()

  if (existing) {
    await db.update(tenantConfig)
      .set({ valor: publicUrl, atualizado_em: timestamp })
      .where(eq(tenantConfig.id, existing.id))
  } else {
    await db.insert(tenantConfig).values({
      id: generateId(), tenant_id: tenantId, chave,
      valor: publicUrl, criado_em: timestamp, atualizado_em: timestamp,
    })
  }

  return c.json({ url: publicUrl, tipo, key })
})

const BRANDING_KEYS = [
  'cor_primaria',
  'cor_secundaria',
  'logo_url',
  'nome_exibicao',
  'favicon_url',
  'descricao',
  'fonte',
  'nome',
  'tagline',
] as const

const updateConfigSchema = z.object({
  cor_primaria: z.string().nullable().optional(),
  cor_secundaria: z.string().nullable().optional(),
  // Aceita URL absoluta OU relativa (/api/v1/media/...) OU data URL (fallback)
  logo_url: z.string().nullable().optional(),
  nome_exibicao: z.string().min(1).nullable().optional(),
  favicon_url: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  fonte: z.string().min(1).max(60).nullable().optional(),
  nome: z.string().min(1).nullable().optional(),
  tagline: z.string().nullable().optional(),
})

const brandingQuery = z.object({
  slug: z.string().min(1, 'Slug do tenant é obrigatório.'),
})

// GET /tenant/config — Retornar configurações (auth required)
tenantRouter.get('/config', authMiddleware, async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenantId))

  const result: Record<string, string | null> = {}
  for (const cfg of configs) {
    result[cfg.chave] = cfg.valor
  }

  return c.json({ tenant_id: tenantId, config: result })
})

// PUT /tenant/config — Atualizar configurações (expert only)
tenantRouter.put('/config', authMiddleware, expertOnly, zValidator('json', updateConfigSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const timestamp = now()

  // valor === null significa "remover" essa chave
  const entries = Object.entries(body).filter(([, v]) => v !== undefined)

  for (const [chave, valor] of entries) {
    const existing = await db.select({ id: tenantConfig.id }).from(tenantConfig)
      .where(and(eq(tenantConfig.tenant_id, tenantId), eq(tenantConfig.chave, chave))).get()

    if (valor === null) {
      // Limpar valor (mantem o registro pra poder ressetar)
      if (existing) {
        await db.update(tenantConfig)
          .set({ valor: null as unknown as string, atualizado_em: timestamp })
          .where(eq(tenantConfig.id, existing.id))
      }
      continue
    }

    if (existing) {
      await db.update(tenantConfig)
        .set({ valor: valor as string, atualizado_em: timestamp })
        .where(eq(tenantConfig.id, existing.id))
    } else {
      await db.insert(tenantConfig).values({
        id: generateId(), tenant_id: tenantId, chave,
        valor: valor as string, criado_em: timestamp, atualizado_em: timestamp,
      })
    }
  }

  // Retornar config atualizada
  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenantId))

  const result: Record<string, string | null> = {}
  for (const cfg of configs) {
    result[cfg.chave] = cfg.valor
  }

  return c.json({ tenant_id: tenantId, config: result })
})

// GET /tenant/branding — Branding público (sem auth, para PWA)
tenantRouter.get('/branding', zValidator('query', brandingQuery), async (c) => {
  const { slug } = c.req.valid('query')
  const db = createDB(c.env.DB)

  // Buscar tenant pelo slug
  const tenant = await db.select({ id: tenants.id, nome: tenants.nome, slug: tenants.slug, logo_url: tenants.logo_url, cor_primaria: tenants.cor_primaria, cor_secundaria: tenants.cor_secundaria })
    .from(tenants).where(eq(tenants.slug, slug)).get()

  if (!tenant) return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)

  // Buscar configs de branding
  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenant.id))

  const configMap: Record<string, string | null> = {}
  for (const cfg of configs) {
    if ((BRANDING_KEYS as readonly string[]).includes(cfg.chave)) {
      configMap[cfg.chave] = cfg.valor
    }
  }

  return c.json({
    nome: configMap['nome_exibicao'] ?? tenant.nome,
    slug: tenant.slug,
    logo_url: configMap['logo_url'] ?? tenant.logo_url,
    favicon_url: configMap['favicon_url'] ?? null,
    cor_primaria: configMap['cor_primaria'] ?? tenant.cor_primaria,
    cor_secundaria: configMap['cor_secundaria'] ?? tenant.cor_secundaria,
    descricao: configMap['descricao'] ?? null,
  })
})

// GET /tenant/branding-by-host — Branding público por hostname (sem auth)
tenantRouter.get('/branding-by-host', async (c) => {
  const host = c.req.query('host')
  if (!host) return c.json({ error: 'Parâmetro host é obrigatório.', code: 400 }, 400)

  const db = createDB(c.env.DB)
  let tenantRow: { id: string; nome: string; slug: string; logo_url: string | null; cor_primaria: string | null; cor_secundaria: string | null } | undefined

  // Check if it's a *.wazefit.com subdomain
  const wazeMatch = host.match(/^([a-z0-9-]+)\.wazefit\.com$/)
  if (wazeMatch && wazeMatch[1] !== 'www' && wazeMatch[1] !== 'api') {
    const slug = wazeMatch[1]!
    tenantRow = await db.select({
      id: tenants.id,
      nome: tenants.nome,
      slug: tenants.slug,
      logo_url: tenants.logo_url,
      cor_primaria: tenants.cor_primaria,
      cor_secundaria: tenants.cor_secundaria,
    }).from(tenants).where(eq(tenants.slug, slug)).get()
  } else {
    // Custom domain lookup
    const dominio = await db.select({
      tenant_id: dominiosTenant.tenant_id,
    }).from(dominiosTenant)
      .where(and(eq(dominiosTenant.dominio, host), eq(dominiosTenant.status, 'active'), isNull(dominiosTenant.deletado_em)))
      .get()

    if (dominio) {
      tenantRow = await db.select({
        id: tenants.id,
        nome: tenants.nome,
        slug: tenants.slug,
        logo_url: tenants.logo_url,
        cor_primaria: tenants.cor_primaria,
        cor_secundaria: tenants.cor_secundaria,
      }).from(tenants).where(eq(tenants.id, dominio.tenant_id)).get()
    }
  }

  if (!tenantRow) return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)

  // Fetch branding configs
  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenantRow.id))

  const configMap: Record<string, string | null> = {}
  for (const cfg of configs) {
    if ((BRANDING_KEYS as readonly string[]).includes(cfg.chave)) {
      configMap[cfg.chave] = cfg.valor
    }
  }

  return c.json({
    nome: configMap['nome_exibicao'] ?? tenantRow.nome,
    slug: tenantRow.slug,
    logo_url: configMap['logo_url'] ?? tenantRow.logo_url,
    favicon_url: configMap['favicon_url'] ?? null,
    cor_primaria: configMap['cor_primaria'] ?? tenantRow.cor_primaria,
    cor_secundaria: configMap['cor_secundaria'] ?? tenantRow.cor_secundaria,
    descricao: configMap['descricao'] ?? null,
  })
})

// ── Slug do tenant ──
// Reservados (nao podem ser usados como slug pra evitar conflito com subdominio do sistema)
const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'auth', 'login', 'register', 'dashboard',
  'help', 'docs', 'support', 'suporte', 'contact', 'mail', 'email', 'static',
  'cdn', 'assets', 'public', 'private', 'wazefit', 'system', 'root',
  'ftp', 'pop', 'smtp', 'webmail', 'staging', 'dev', 'test', 'beta', 'demo',
])

const slugSchema = z
  .string()
  .min(3, 'Subdominio deve ter pelo menos 3 caracteres.')
  .max(30, 'Subdominio deve ter no maximo 30 caracteres.')
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Use apenas letras minusculas, numeros e hifens (sem hifen no inicio ou fim).')
  .refine((s) => !RESERVED_SLUGS.has(s), 'Esse subdominio e reservado, escolha outro.')

const updateSlugSchema = z.object({ slug: slugSchema })

// GET /tenant/slug-available?slug=xxx — verifica disponibilidade (sem auth, rate-limited via login)
tenantRouter.get('/slug-available', async (c) => {
  const slug = (c.req.query('slug') ?? '').trim().toLowerCase()
  const parse = slugSchema.safeParse(slug)
  if (!parse.success) {
    return c.json({ available: false, error: parse.error.issues[0]?.message ?? 'Slug invalido' })
  }

  const db = createDB(c.env.DB)
  const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).get()
  return c.json({ available: !existing, slug })
})

// PUT /tenant/slug — Atualizar slug do tenant (expert/owner only)
tenantRouter.put('/slug', authMiddleware, expertOnly, zValidator('json', updateSlugSchema), async (c) => {
  const { slug } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar se o slug ja esta em uso por outro tenant
  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, slug), isNull(tenants.deletado_em)))
    .get()

  if (existing && existing.id !== tenantId) {
    return c.json({ error: 'Esse subdominio ja esta em uso. Escolha outro.', code: 409 }, 409)
  }

  if (existing && existing.id === tenantId) {
    // Sem mudanca
    return c.json({ slug, painel_url: `https://${slug}.wazefit.com` })
  }

  // Capturar slug antigo para remover do KV
  const current = await db.select({ slug: tenants.slug, nome: tenants.nome }).from(tenants).where(eq(tenants.id, tenantId)).get()
  const oldSlug = current?.slug
  const tenantNome = current?.nome ?? ''

  await db
    .update(tenants)
    .set({ slug, atualizado_em: now() })
    .where(eq(tenants.id, tenantId))

  // Sincronizar KV_TENANTS (lookup do tenant-proxy)
  try {
    if (oldSlug && oldSlug !== slug) {
      await c.env.KV_TENANTS.delete(oldSlug)
    }
    await c.env.KV_TENANTS.put(
      slug,
      JSON.stringify({ tenant_id: tenantId, nome: tenantNome, atualizado_em: now() }),
    )
  } catch (err) {
    console.error('KV_TENANTS sync failed:', err)
  }

  return c.json({
    slug,
    painel_url: `https://${slug}.wazefit.com`,
    aviso: 'O endereco do seu painel foi atualizado. Use o novo URL para acessar.',
  })
})

// ── Lookup público: domínio → tenant slug ──
// GET /api/v1/tenant/lookup?domain=app.minhaacademia.com
tenantRouter.get('/lookup', async c => {
  const domain = c.req.query('domain')
  if (!domain) {
    return c.json({ error: 'Query param "domain" obrigatório' }, 400)
  }

  const db = createDB(c.env.DB)

  // Busca domínio custom ativo
  const dominio = await db
    .select({
      tenantId: dominiosTenant.tenant_id,
    })
    .from(dominiosTenant)
    .where(and(eq(dominiosTenant.dominio, domain), eq(dominiosTenant.status, 'active')))
    .limit(1)

  if (dominio.length === 0) {
    return c.json({ error: 'Domínio não encontrado ou inativo' }, 404)
  }

  // Busca tenant
  const tenant = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, dominio[0].tenantId))
    .limit(1)

  if (tenant.length === 0) {
    return c.json({ error: 'Tenant não encontrado' }, 404)
  }

  return c.json({ slug: tenant[0].slug })
})

export { tenantRouter }
