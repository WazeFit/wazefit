'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const slug = localStorage.getItem('wf_tenant_slug')
    if (slug) {
      window.location.href = `https://${slug}.wazefit.com/`
      return
    }
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Redirecionando para o seu painel…</p>
      </div>
    </div>
  )
}
