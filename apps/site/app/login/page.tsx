'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wazefit.com'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas')

      if (data.access_token) {
        localStorage.setItem('wf_token', data.access_token)
      }

      const tenantSlug = data.tenant?.slug
      if (tenantSlug) {
        window.location.href = `https://${tenantSlug}.wazefit.com/`
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-brand-900/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-brand-400" />
            </div>
            <span className="font-bold text-xl">WazeFit</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
          <p className="text-muted-foreground">Entre na sua plataforma</p>
        </div>

        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <input
                type="email"
                required
                className="input-base"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Senha</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-500 transition-all"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                required
                className="input-base"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Ainda não tem conta?{' '}
              <Link href="/register" className="text-brand-400 hover:text-brand-500 font-medium">
                Criar conta grátis
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/forgot-password" className="hover:text-foreground transition-all">
                Esqueci meu email ou senha
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
