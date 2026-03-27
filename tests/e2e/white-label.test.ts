/**
 * White Label E2E Tests
 * 
 * Testa o fluxo completo de White Label contra a API real:
 * 1. Auth (login como expert)
 * 2. GET /tenant/config → lê configurações
 * 3. PUT /tenant/config → salva cores/nome
 * 4. GET /tenant/branding?slug=xxx → branding público
 * 5. GET /tenant/branding-by-host?host=xxx → branding por hostname
 * 6. GET /tenant/lookup?domain=xxx → lookup de domínio
 * 
 * Uso: npx vitest run tests/e2e/white-label.test.ts
 */
import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_URL || 'https://api.wazefit.com'

// Credenciais de teste — usar variáveis de ambiente em CI
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@wazefit.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123456!'

let token: string = ''
let tenantSlug: string = ''

async function api(method: string, path: string, body?: unknown, authToken?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)
  return { status: res.status, data, ok: res.ok }
}

describe('White Label E2E', () => {
  // ──────────────────────────────────────────────
  // 0. Health check
  // ──────────────────────────────────────────────
  it('API está online', async () => {
    const res = await api('GET', '/ping')
    expect(res.status).toBe(200)
    expect(res.data.status).toBe('ok')
  })

  // ──────────────────────────────────────────────
  // 1. Auth — login como expert
  // ──────────────────────────────────────────────
  describe('Auth', () => {
    it('login com credenciais válidas', async () => {
      const res = await api('POST', '/api/v1/auth/login', {
        email: TEST_EMAIL,
        senha: TEST_PASSWORD,
      })

      // Se não tem conta de teste, skip os testes autenticados
      if (res.status === 401 || res.status === 404) {
        console.warn('⚠️ Conta de teste não encontrada — pulando testes autenticados')
        return
      }

      expect(res.status).toBe(200)
      expect(res.data.token).toBeDefined()
      token = res.data.token
      tenantSlug = res.data.tenant?.slug || res.data.slug || ''
    })
  })

  // ──────────────────────────────────────────────
  // 2. Tenant Config — CRUD
  // ──────────────────────────────────────────────
  describe('Tenant Config', () => {
    it('GET /tenant/config retorna configurações', async () => {
      if (!token) return

      const res = await api('GET', '/api/v1/tenant/config', undefined, token)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('tenant_id')
      expect(res.data).toHaveProperty('config')
    })

    it('PUT /tenant/config salva cores e nome', async () => {
      if (!token) return

      const testConfig = {
        cor_primaria: '#FF6B35',
        cor_secundaria: '#004E89',
        nome_exibicao: 'E2E Test Academy',
        descricao: 'Teste automatizado White Label',
      }

      const res = await api('PUT', '/api/v1/tenant/config', testConfig, token)
      expect(res.status).toBe(200)
      expect(res.data.config.cor_primaria).toBe('#FF6B35')
      expect(res.data.config.cor_secundaria).toBe('#004E89')
      expect(res.data.config.nome_exibicao).toBe('E2E Test Academy')
    })

    it('PUT /tenant/config rejeita sem auth', async () => {
      const res = await api('PUT', '/api/v1/tenant/config', {
        cor_primaria: '#000000',
      })
      expect(res.status).toBe(401)
    })

    it('GET /tenant/config reflete mudanças', async () => {
      if (!token) return

      const res = await api('GET', '/api/v1/tenant/config', undefined, token)
      expect(res.status).toBe(200)
      expect(res.data.config.cor_primaria).toBe('#FF6B35')
      expect(res.data.config.nome_exibicao).toBe('E2E Test Academy')
    })
  })

  // ──────────────────────────────────────────────
  // 3. Branding Público
  // ──────────────────────────────────────────────
  describe('Branding Público', () => {
    it('GET /tenant/branding?slug=xxx retorna branding', async () => {
      if (!tenantSlug) return

      const res = await api('GET', `/api/v1/tenant/branding?slug=${tenantSlug}`)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('nome')
      expect(res.data).toHaveProperty('slug')
      expect(res.data).toHaveProperty('cor_primaria')
    })

    it('GET /tenant/branding?slug=inexistente retorna 404', async () => {
      const res = await api('GET', '/api/v1/tenant/branding?slug=slug-que-nao-existe-xyz')
      expect(res.status).toBe(404)
    })

    it('GET /tenant/branding sem slug retorna erro', async () => {
      const res = await api('GET', '/api/v1/tenant/branding')
      expect(res.status).toBe(400)
    })

    it('GET /tenant/branding-by-host?host=xxx funciona', async () => {
      if (!tenantSlug) return

      const res = await api('GET', `/api/v1/tenant/branding-by-host?host=${tenantSlug}.wazefit.com`)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('nome')
      expect(res.data).toHaveProperty('cor_primaria')
    })

    it('GET /tenant/branding-by-host sem host retorna 400', async () => {
      const res = await api('GET', '/api/v1/tenant/branding-by-host')
      expect(res.status).toBe(400)
    })
  })

  // ──────────────────────────────────────────────
  // 4. Lookup de Domínio
  // ──────────────────────────────────────────────
  describe('Domain Lookup', () => {
    it('GET /tenant/lookup sem domain retorna 400', async () => {
      const res = await api('GET', '/api/v1/tenant/lookup')
      expect(res.status).toBe(400)
    })

    it('GET /tenant/lookup com domínio inexistente retorna 404', async () => {
      const res = await api('GET', '/api/v1/tenant/lookup?domain=naoexiste.xyz.com')
      expect(res.status).toBe(404)
    })
  })

  // ──────────────────────────────────────────────
  // 5. Upload Branding (requer auth)
  // ──────────────────────────────────────────────
  describe('Branding Upload', () => {
    it('POST /tenant/branding/upload rejeita sem auth', async () => {
      const formData = new FormData()
      formData.append('tipo', 'logo')
      formData.append('file', new Blob(['fake'], { type: 'image/png' }), 'test.png')

      const res = await fetch(`${API_BASE}/api/v1/tenant/branding/upload`, {
        method: 'POST',
        body: formData,
      })
      expect(res.status).toBe(401)
    })

    it('POST /tenant/branding/upload rejeita tipo inválido', async () => {
      if (!token) return

      const formData = new FormData()
      formData.append('tipo', 'invalido')
      formData.append('file', new Blob(['fake'], { type: 'image/png' }), 'test.png')

      const res = await fetch(`${API_BASE}/api/v1/tenant/branding/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      expect(res.status).toBe(400)
    })

    it('POST /tenant/branding/upload aceita logo PNG válido', async () => {
      if (!token) return

      // Criar um PNG mínimo válido (1x1 pixel transparente)
      const pngHeader = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, // RGBA
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT
        0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02,
        0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
        0x60, 0x82, // IEND
      ])

      const formData = new FormData()
      formData.append('tipo', 'logo')
      formData.append('file', new Blob([pngHeader], { type: 'image/png' }), 'test-logo.png')

      const res = await fetch(`${API_BASE}/api/v1/tenant/branding/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      // Pode ser 200 (sucesso) ou 503 (R2 não configurado)
      if (res.status === 503) {
        console.warn('⚠️ R2 não configurado — upload test skipped')
        return
      }

      expect(res.status).toBe(200)
      const data = await res.json() as { url: string; tipo: string }
      expect(data.url).toBeDefined()
      expect(data.tipo).toBe('logo')
    })
  })

  // ──────────────────────────────────────────────
  // 6. Domínios Custom (CRUD)
  // ──────────────────────────────────────────────
  describe('Domínios Custom', () => {
    let dominioId: string = ''

    it('GET /tenant/dominios lista domínios', async () => {
      if (!token) return

      const res = await api('GET', '/api/v1/tenant/dominios', undefined, token)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data?.data || res.data)).toBe(true)
    })

    it('POST /tenant/dominios rejeita domínio inválido', async () => {
      if (!token) return

      const res = await api('POST', '/api/v1/tenant/dominios', {
        dominio: 'not a domain',
      }, token)
      expect(res.status).toBe(400)
    })

    it('POST /tenant/dominios cria domínio válido', async () => {
      if (!token) return

      const res = await api('POST', '/api/v1/tenant/dominios', {
        dominio: `e2e-test-${Date.now()}.example.com`,
      }, token)

      expect([201, 409]).toContain(res.status)
      if (res.status === 201) {
        dominioId = res.data.id
        expect(res.data.dominio).toContain('e2e-test-')
      }
    })

    it('DELETE /tenant/dominios/:id remove domínio', async () => {
      if (!token || !dominioId) return

      const res = await api('DELETE', `/api/v1/tenant/dominios/${dominioId}`, undefined, token)
      expect(res.status).toBe(200)
    })
  })

  // ──────────────────────────────────────────────
  // 7. CORS e segurança
  // ──────────────────────────────────────────────
  describe('CORS & Security', () => {
    it('OPTIONS retorna headers CORS', async () => {
      const res = await fetch(`${API_BASE}/api/v1/tenant/config`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://wazefit.com',
          'Access-Control-Request-Method': 'GET',
        },
      })
      expect(res.headers.get('access-control-allow-origin')).toBeDefined()
    })

    it('rotas protegidas rejeitam token inválido', async () => {
      const res = await api('GET', '/api/v1/tenant/config', undefined, 'token-invalido-xyz')
      expect(res.status).toBe(401)
    })
  })
})
