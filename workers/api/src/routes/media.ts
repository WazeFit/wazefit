/**
 * Rotas de upload de mídia via R2.
 * Gera presigned URLs para upload direto e confirma referências.
 *
 * GET  /api/v1/media/upload-url — Gerar presigned URL para upload R2
 * POST /api/v1/media/confirm    — Confirmar upload e salvar referência
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env, AuthVariables } from '../types'
import { generateId } from '../lib/id'
import { authMiddleware } from '../middleware/auth'

const mediaRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

mediaRouter.use('*', authMiddleware)

// ── Tipos e extensões permitidas ──

const ALLOWED_TYPES: Record<string, { extensions: string[]; contentTypes: string[]; maxSizeMb: number }> = {
  imagem: {
    extensions: ['jpg', 'jpeg', 'png', 'heic', 'webp'],
    contentTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
    maxSizeMb: 10,
  },
  video: {
    extensions: ['mp4', 'mov', 'webm'],
    contentTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
    maxSizeMb: 100,
  },
  documento: {
    extensions: ['pdf'],
    contentTypes: ['application/pdf'],
    maxSizeMb: 20,
  },
}

// ── Schemas de validação ──

const uploadUrlQuerySchema = z.object({
  tipo: z.enum(['imagem', 'video', 'documento']),
  filename: z.string().min(1, 'Nome do arquivo é obrigatório.'),
  content_type: z.string().min(1, 'Content-Type é obrigatório.'),
})

const confirmSchema = z.object({
  key: z.string().min(1, 'Key do arquivo é obrigatória.'),
  tipo: z.enum(['imagem', 'video', 'documento']),
  filename: z.string().min(1),
  content_type: z.string().min(1),
  size_bytes: z.number().int().min(1).optional(),
})

// ═══════════════════════════════════════════════════════════════
// GET /media/upload-url — Gerar presigned URL para upload R2
// ═══════════════════════════════════════════════════════════════
mediaRouter.get('/upload-url', zValidator('query', uploadUrlQuerySchema), async (c) => {
  const { tipo, filename, content_type } = c.req.valid('query')
  const tenantId = c.get('tenant_id')

  // Validar tipo de arquivo
  const tipoConfig = ALLOWED_TYPES[tipo]
  if (!tipoConfig) {
    return c.json({ error: 'Tipo de arquivo não suportado.', code: 400 }, 400)
  }

  // Validar content type
  if (!tipoConfig.contentTypes.includes(content_type)) {
    return c.json(
      {
        error: `Content-Type '${content_type}' não permitido para tipo '${tipo}'. Permitidos: ${tipoConfig.contentTypes.join(', ')}`,
        code: 400,
      },
      400,
    )
  }

  // Validar extensão
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (!tipoConfig.extensions.includes(ext)) {
    return c.json(
      {
        error: `Extensão '${ext}' não permitida para tipo '${tipo}'. Permitidas: ${tipoConfig.extensions.join(', ')}`,
        code: 400,
      },
      400,
    )
  }

  const fileId = generateId()
  const key = `${tenantId}/${tipo}/${fileId}/${filename}`

  // Verificar se R2 está disponível
  if (!c.env.R2_PRIVATE) {
    return c.json({ error: 'Serviço de storage não configurado.', code: 503 }, 503)
  }

  // Gerar multipart upload ou URL de PUT direta
  // Para Workers, usamos PUT direto no R2 via API
  // O cliente faz PUT diretamente para o worker que faz proxy para R2
  const uploadUrl = `/api/v1/media/upload/${key}`

  return c.json({
    upload_url: uploadUrl,
    key,
    method: 'PUT',
    headers: {
      'Content-Type': content_type,
    },
    max_size_mb: tipoConfig.maxSizeMb,
    expires_in: 3600,
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /media/confirm — Confirmar upload e salvar referência
// ═══════════════════════════════════════════════════════════════
mediaRouter.post('/confirm', zValidator('json', confirmSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')

  // Verificar se R2 está disponível
  if (!c.env.R2_PRIVATE) {
    return c.json({ error: 'Serviço de storage não configurado.', code: 503 }, 503)
  }

  // Verificar que a key pertence ao tenant
  if (!body.key.startsWith(`${tenantId}/`)) {
    return c.json({ error: 'Acesso negado a este arquivo.', code: 403 }, 403)
  }

  // Verificar se o objeto existe no R2
  const obj = await c.env.R2_PRIVATE.head(body.key)
  if (!obj) {
    return c.json({ error: 'Arquivo não encontrado no storage.', code: 404 }, 404)
  }

  // Validar tamanho
  const tipoConfig = ALLOWED_TYPES[body.tipo]
  const maxBytes = tipoConfig.maxSizeMb * 1024 * 1024
  if (obj.size > maxBytes) {
    // Deletar arquivo que excede o limite
    await c.env.R2_PRIVATE.delete(body.key)
    return c.json(
      {
        error: `Arquivo excede o limite de ${tipoConfig.maxSizeMb}MB.`,
        code: 413,
      },
      413,
    )
  }

  return c.json({
    key: body.key,
    tipo: body.tipo,
    filename: body.filename,
    content_type: body.content_type,
    size_bytes: obj.size,
    confirmado: true,
  })
})

// ═══════════════════════════════════════════════════════════════
// PUT /media/upload/* — Proxy upload para R2
// ═══════════════════════════════════════════════════════════════
mediaRouter.put('/upload/*', async (c) => {
  const tenantId = c.get('tenant_id')

  // Verificar se R2 está disponível
  if (!c.env.R2_PRIVATE) {
    return c.json({ error: 'Serviço de storage não configurado.', code: 503 }, 503)
  }

  // Extrair key do path (remover /api/v1/media/upload/)
  const url = new URL(c.req.url)
  const key = url.pathname.replace(/^\/api\/v1\/media\/upload\//, '')

  // Verificar que a key pertence ao tenant
  if (!key.startsWith(`${tenantId}/`)) {
    return c.json({ error: 'Acesso negado.', code: 403 }, 403)
  }

  const contentType = c.req.header('Content-Type') ?? 'application/octet-stream'
  const body = await c.req.arrayBuffer()

  await c.env.R2_PRIVATE.put(key, body, {
    httpMetadata: {
      contentType,
    },
  })

  return c.json({
    key,
    size_bytes: body.byteLength,
    content_type: contentType,
    uploaded: true,
  })
})

export { mediaRouter }
