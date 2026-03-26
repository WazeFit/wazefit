/**
 * WazeFit Tenant Proxy Worker
 * 
 * Rota *.wazefit.com → wazefit.pages.dev
 * Extrai {slug} do hostname e injeta no frontend via header
 */

interface Env {
  // Vazio por enquanto — pode adicionar KV depois pra cache
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const hostname = url.hostname

    // Se for apex ou www, passa direto pro Pages
    if (hostname === 'wazefit.com' || hostname === 'www.wazefit.com') {
      return fetch(`https://wazefit.pages.dev${url.pathname}${url.search}`, {
        ...request,
        headers: request.headers,
      })
    }

    // Extrai slug do subdomínio (ex: academia-x.wazefit.com → academia-x)
    const slug = hostname.replace('.wazefit.com', '')

    // Valida slug (apenas letras, números e hífens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return new Response('Invalid subdomain', { status: 400 })
    }

    // Faz proxy pro Pages
    // Importante: não pode passar headers customizados pro Pages.dev, senão dá 522
    const pagesUrl = `https://wazefit.pages.dev${url.pathname}${url.search}`
    
    // Cria headers limpos (apenas os essenciais)
    const headers = new Headers()
    headers.set('Host', 'wazefit.pages.dev')
    headers.set('User-Agent', request.headers.get('User-Agent') || 'WazeFit-Proxy')
    
    // Copia cookies se existirem
    const cookie = request.headers.get('Cookie')
    if (cookie) headers.set('Cookie', cookie)

    const pagesRequest = new Request(pagesUrl, {
      method: request.method,
      headers,
      redirect: 'manual',
    })

    const response = await fetch(pagesRequest)
    
    // Adiciona headers de tenant na response (pro frontend ler via JS)
    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Tenant-Slug', slug)
    newHeaders.set('X-Original-Host', hostname)

    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })

    // Reescreve Location header em redirects pra manter o domínio custom
    if (newResponse.status >= 300 && newResponse.status < 400) {
      const location = newResponse.headers.get('Location')
      if (location && location.includes('wazefit.pages.dev')) {
        const newLocation = location.replace('wazefit.pages.dev', hostname)
        newHeaders.set('Location', newLocation)
      }
    }

    return newResponse
  },
}
