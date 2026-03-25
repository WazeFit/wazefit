/**
 * TenantContext — detecção de tenant por hostname.
 * 
 * Se o hostname é um subdomínio *.wazefit.com ou domínio custom,
 * carrega branding do tenant automaticamente.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface TenantBranding {
  nome: string
  slug: string
  cor_primaria: string | null
  cor_secundaria: string | null
  logo_url: string | null
  favicon_url: string | null
  descricao?: string | null
}

interface TenantContextValue {
  branding: TenantBranding | null
  loading: boolean
  isTenantHost: boolean
}

const TenantContext = createContext<TenantContextValue>({
  branding: null,
  loading: false,
  isTenantHost: false,
})

export function useTenant() {
  return useContext(TenantContext)
}

const SKIP_HOSTS = [
  'localhost',
  '127.0.0.1',
  'wazefit.com',
  'www.wazefit.com',
  'api.wazefit.com',
]

function shouldDetectTenant(hostname: string): boolean {
  if (SKIP_HOSTS.includes(hostname)) return false
  if (hostname.startsWith('localhost:')) return false
  if (hostname.startsWith('127.0.0.1:')) return false
  return true
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTenantHost, setIsTenantHost] = useState(false)

  useEffect(() => {
    const hostname = window.location.hostname

    if (!shouldDetectTenant(hostname)) {
      setLoading(false)
      return
    }

    setIsTenantHost(true)

    fetch(`https://api.wazefit.com/api/v1/tenant/branding-by-host?host=${encodeURIComponent(hostname)}`)
      .then(res => {
        if (!res.ok) throw new Error('Tenant not found')
        return res.json() as Promise<TenantBranding>
      })
      .then(data => {
        setBranding(data)
        // Apply branding to document
        if (data.favicon_url) {
          const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
          if (link) link.href = data.favicon_url
        }
        if (data.nome) {
          document.title = data.nome
        }
      })
      .catch(() => {
        // Tenant not found — continue without branding
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <TenantContext.Provider value={{ branding, loading, isTenantHost }}>
      {children}
    </TenantContext.Provider>
  )
}
