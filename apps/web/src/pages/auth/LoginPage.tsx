/**
 * Página de Login.
 */
import { useState } from 'react'
import { login, ApiError } from '../../stores/auth'
import type { User, Tenant } from '../../stores/auth'

interface Props {
  onSuccess: (user: User, tenant: Tenant) => void
  onNavigate: (path: string) => void
}

export function LoginPage({ onSuccess, onNavigate }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const result = await login(email, senha)
      onSuccess(result.user, result.tenant)
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.body.error)
      } else {
        setErro('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center font-bold text-lg">W</div>
            <span className="text-2xl font-bold text-white">Waze<span className="text-brand-400">Fit</span></span>
          </div>
          <p className="text-gray-400">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Não tem conta?{' '}
          <button onClick={() => onNavigate('/register')} className="text-brand-400 hover:text-brand-300">Criar conta</button>
        </p>
      </div>
    </div>
  )
}
