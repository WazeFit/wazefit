'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Loader2, ArrowRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wazefit.com'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', nome_negocio: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg =
          data?.error?.issues?.[0]?.message ||
          (typeof data?.error === 'string' ? data.error : null) ||
          'Erro ao criar conta'
        throw new Error(msg)
      }

      if (data.access_token) localStorage.setItem('wf_token', data.access_token)
      if (data.tenant?.slug) {
        localStorage.setItem('wf_tenant_slug', data.tenant.slug)
      }
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-brand-900/20 p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-brand-400" />
            </div>
            <span className="font-bold text-xl">WazeFit</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Crie sua plataforma</h1>
          <p className="text-muted-foreground">Grátis, sem cartão de crédito.</p>
        </div>

        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Seu nome</label>
              <input
                required
                className="input-base"
                placeholder="Como você se chama"
                value={form.nome}
                onChange={(e) => update('nome', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do seu negócio</label>
              <input
                required
                className="input-base"
                placeholder="Ex: FitPro Academia"
                value={form.nome_negocio}
                onChange={(e) => update('nome_negocio', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <input
                type="email"
                required
                className="input-base"
                placeholder="voce@exemplo.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Senha</label>
              <input
                type="password"
                required
                className="input-base"
                placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número"
                value={form.senha}
                onChange={(e) => update('senha', e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar conta
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-500 font-medium">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
