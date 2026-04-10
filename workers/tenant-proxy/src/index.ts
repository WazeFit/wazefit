/**
 * WazeFit Tenant Proxy Worker
 *
 * wazefit.com / www.wazefit.com → wazefit.pages.dev (landing/onboarding)
 * *.wazefit.com (subdomínios)   → wazefit-tenant.pages.dev (painel)
 * api.wazefit.com               → NÃO passa aqui (route separada no wrangler)
 *
 * Validação: antes de fazer proxy para um subdomínio, valida que o slug
 * existe em KV_TENANTS. Se não existir, retorna 404 amigável.
 */

interface Env {
  KV_TENANTS: KVNamespace
}

// Slug 'app' é fixo (entry point app.wazefit.com) e nunca exige tenant em KV.
const RESERVED_BYPASS_SLUGS = new Set(['app'])

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

    // Validar slug em KV — exceto reservados (app, etc)
    if (!RESERVED_BYPASS_SLUGS.has(slug)) {
      const exists = await env.KV_TENANTS.get(slug)
      if (!exists) {
        return new Response(notFoundHtml(slug), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
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

// ─────────────────────────────────────────────────────────────────
// 404 — página amigável quando o subdomínio não existe
// ─────────────────────────────────────────────────────────────────
function notFoundHtml(slug: string): string {
  const safeSlug = slug.replace(/[<>"&]/g, '')
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Plataforma não encontrada · WazeFit</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #0a0a0a;
      color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: radial-gradient(ellipse at top, rgba(34,197,94,.08), transparent 60%);
    }
    .card {
      max-width: 480px;
      width: 100%;
      text-align: center;
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px;
      padding: 48px 32px;
      backdrop-filter: blur(12px);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(34,197,94,.15);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .icon svg { width: 32px; height: 32px; color: #4ade80; }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 12px; }
    p {
      color: rgba(255,255,255,.6);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .slug {
      font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
      color: #4ade80;
      font-size: 14px;
      margin: 16px 0 28px;
      padding: 10px 16px;
      background: rgba(34,197,94,.08);
      border-radius: 10px;
      display: inline-block;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    @media (min-width: 480px) {
      .actions { flex-direction: row; justify-content: center; }
    }
    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: all .15s;
    }
    .primary {
      background: #22c55e;
      color: #fff;
    }
    .primary:hover { background: #16a34a; }
    .outline {
      background: transparent;
      color: rgba(255,255,255,.85);
      border: 1px solid rgba(255,255,255,.15);
    }
    .outline:hover { background: rgba(255,255,255,.05); }
    footer {
      margin-top: 32px;
      font-size: 12px;
      color: rgba(255,255,255,.35);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <h1>Plataforma não encontrada</h1>
      <p>O subdomínio que você acessou não existe ou foi removido.</p>
      <div class="slug">${safeSlug}.wazefit.com</div>
      <p>Verifique o link ou crie sua plataforma agora — leva menos de 2 minutos.</p>
      <div class="actions">
        <a href="https://wazefit.com" class="outline">Ir para wazefit.com</a>
        <a href="https://wazefit.com/register" class="primary">Criar minha plataforma</a>
      </div>
      <footer>WazeFit · Plataforma white label fitness</footer>
    </div>
  </div>
</body>
</html>`
}
