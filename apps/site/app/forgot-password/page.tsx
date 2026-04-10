'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Loader2, Mail, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wazefit.com'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Não foi possível enviar o email')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar recuperação')
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
          <h1 className="text-3xl font-bold mb-2">Recuperar acesso</h1>
          <p className="text-muted-foreground">
            Digite o email cadastrado — enviaremos um link para você voltar a entrar na plataforma.
          </p>
        </div>

        <div className="glass p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-xl font-bold">Email enviado</h2>
              <p className="text-sm text-muted-foreground">
                Se existir uma conta cadastrada com <strong className="text-foreground">{email}</strong>, você receberá
                um link para redefinir sua senha. Verifique também a caixa de spam.
              </p>
              <Link href="/login" className="btn-outline inline-block mt-4">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    className="input-base pl-10"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar link de recuperação
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Esqueceu também o email de cadastro? Escreva para{' '}
                <a href="mailto:suporte@wazefit.com" className="text-brand-400 hover:text-brand-500">
                  suporte@wazefit.com
                </a>
              </p>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-all">
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
