'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Loader2, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wazefit.com'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (senha.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (senha !== confirmar) return setError('As senhas não coincidem.')
    if (!token) return setError('Token ausente. Solicite novamente o link de recuperação.')

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Não foi possível redefinir a senha')
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold">Senha redefinida</h2>
        <p className="text-sm text-muted-foreground">Você será redirecionado para o login…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-2 block">Nova senha</label>
        <input
          type="password"
          required
          className="input-base"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1.5">Mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número.</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Confirmar senha</label>
        <input
          type="password"
          required
          className="input-base"
          placeholder="••••••••"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Redefinir senha
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
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
          <h1 className="text-3xl font-bold mb-2">Redefinir senha</h1>
        </div>
        <div className="glass p-8">
          <Suspense fallback={<div className="text-center text-muted-foreground">Carregando…</div>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
