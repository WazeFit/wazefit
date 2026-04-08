/**
 * WazeFit Tenant Proxy Worker
 *
 * wazefit.com / www.wazefit.com → wazefit.pages.dev (landing/onboarding)
 * *.wazefit.com (subdomínios) → wazefit-tenant.pages.dev (painel expert/aluno)
 * api.wazefit.com → NÃO passa aqui (rota separada no wrangler)
 */

interface Env {}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const hostname = url.hostname

    // ── Apex/www → site principal (landing, onboarding, registro) ──
    if (hostname === 'wazefit.com' || hostname === 'www.wazefit.com') {
      const pagesUrl = `https://wazefit.pages.dev${url.pathname}${url.search}`
      const headers = new Headers()
      headers.set('Host', 'wazefit.pages.dev')
      headers.set('User-Agent', request.headers.get('User-Agent') || 'WazeFit-Proxy')
      const cookie = request.headers.get('Cookie')
      if (cookie) headers.set('Cookie', cookie)

      const response = await fetch(new Request(pagesUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'manual',
      }))

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    // ── Subdomínios (trainer-pro.wazefit.com) → painel tenant ──
    const slug = hostname.replace('.wazefit.com', '')

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
      return new Response('Subdominio invalido', { status: 400 })
    }

    // Proxy para o painel tenant (Next.js no Cloudflare Pages)
    const tenantUrl = `https://wazefit-tenant.pages.dev${url.pathname}${url.search}`
    const headers = new Headers()
    headers.set('Host', 'wazefit-tenant.pages.dev')
    headers.set('User-Agent', request.headers.get('User-Agent') || 'WazeFit-Proxy')

    // Passar cookies e auth
    const cookie = request.headers.get('Cookie')
    if (cookie) headers.set('Cookie', cookie)
    const auth = request.headers.get('Authorization')
    if (auth) headers.set('Authorization', auth)

    // Passar content-type para POST/PUT
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const ct = request.headers.get('Content-Type')
      if (ct) headers.set('Content-Type', ct)
    }

    const proxyRequest = new Request(tenantUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'manual',
    })

    const response = await fetch(proxyRequest)

    // Adicionar headers de tenant na response
    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Tenant-Slug', slug)
    newHeaders.set('X-Original-Host', hostname)

    // Reescrever redirects para manter dominio do tenant
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location')
      if (location) {
        const fixed = location
          .replace('wazefit-tenant.pages.dev', hostname)
          .replace('wazefit.pages.dev', hostname)
        newHeaders.set('Location', fixed)
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  },
}
