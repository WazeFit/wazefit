/**
 * Hook para detectar tenant automaticamente pelo hostname.
 * 
 * Fluxo:
 * 1. Tenta extrair slug do subdomínio (*.wazefit.com)
 * 2. Se for domínio custom, faz lookup via API
 * 3. Salva no localStorage
 */

import { useEffect, useState } from 'react'
import { getTenantSlugFromHostname, isCustomDomain, setTenantSlug, getTenantSlug } from '../lib/tenant'

export function useTenantDetection() {
  const [slug, setSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTenantHost, setIsTenantHost] = useState(false)

  useEffect(() => {
    async function detect() {
      // Tenta pegar do hostname
      const hostnameSlug = getTenantSlugFromHostname()
      if (hostnameSlug) {
        setTenantSlug(hostnameSlug)
        setSlug(hostnameSlug)
        setIsTenantHost(true)
        setLoading(false)
        return
      }

      // Se for domínio custom, faz lookup
      if (isCustomDomain()) {
        setIsTenantHost(true) // domínio custom = é tenant host
        try {
          const res = await fetch(
            `https://api.wazefit.com/api/v1/tenant/lookup?domain=${window.location.hostname}`
          )
          if (res.ok) {
            const data = await res.json()
            setTenantSlug(data.slug)
            setSlug(data.slug)
          }
        } catch (err) {
          console.error('Erro ao detectar tenant:', err)
        }
      } else {
        // Apex ou dev — tenta pegar do localStorage
        const saved = getTenantSlug()
        if (saved) {
          setSlug(saved)
        }
      }

      setLoading(false)
    }

    detect()
  }, [])

  return { slug, loading, isTenantHost }
}
