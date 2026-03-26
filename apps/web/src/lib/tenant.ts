/**
 * Tenant Detection & Branding
 * 
 * Detecta o tenant pelo subdomínio ou domínio custom
 * e aplica configurações de branding.
 */

/**
 * Extrai o tenant slug do hostname atual.
 * 
 * Exemplos:
 * - academia-x.wazefit.com → "academia-x"
 * - app.minhaacademia.com → null (domínio custom, precisa lookup via API)
 * - wazefit.com → null (apex)
 * - localhost:5173 → null (dev)
 */
export function getTenantSlugFromHostname(): string | null {
  const hostname = window.location.hostname

  // Dev/localhost
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return null
  }

  // Apex domains
  if (hostname === 'wazefit.com' || hostname === 'www.wazefit.com') {
    return null
  }

  // Pages.dev
  if (hostname.endsWith('.pages.dev')) {
    return null
  }

  // Subdomínio *.wazefit.com
  if (hostname.endsWith('.wazefit.com')) {
    return hostname.replace('.wazefit.com', '')
  }

  // Domínio custom — retorna null, precisa fazer lookup via API
  return null
}

/**
 * Detecta se está em domínio custom (não é *.wazefit.com nem apex).
 */
export function isCustomDomain(): boolean {
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return false
  }

  if (hostname === 'wazefit.com' || hostname === 'www.wazefit.com') {
    return false
  }

  if (hostname.endsWith('.pages.dev')) {
    return false
  }

  if (hostname.endsWith('.wazefit.com')) {
    return false
  }

  return true
}

/**
 * Salva o tenant slug no localStorage.
 * Usado quando o backend retorna o tenant via API lookup.
 */
export function setTenantSlug(slug: string) {
  localStorage.setItem('wf_tenant_slug', slug)
}

/**
 * Lê o tenant slug do localStorage.
 */
export function getTenantSlug(): string | null {
  return localStorage.getItem('wf_tenant_slug')
}

/**
 * Limpa o tenant slug (logout).
 */
export function clearTenantSlug() {
  localStorage.removeItem('wf_tenant_slug')
}
