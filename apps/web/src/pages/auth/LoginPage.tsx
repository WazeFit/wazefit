/**
 * Página de Login — com suporte a white label.
 * Quando acessada via subdomínio do tenant, mostra branding customizado.
 */
import { useState } from 'react'
import { login } from '../../stores/auth'
import type { User, Tenant } from '../../stores/auth'
import { TenantBrand, useTenantColors } from '../../components/ui/TenantBrand'
import { useTenant } from '../../contexts/TenantContext'

interface Props {
  onSuccess: (user: User, tenant: Tenant) => void
  onNavigate: (path: string) => void
}

export function LoginPage({ onSuccess, onNavigate }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { primary } = useTenantColors()
  const { isTenantHost, branding } = useTenant()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const result = await login(email, senha)
      onSuccess(result.user, result.tenant)
    } catch (err) {
      if (err instanceof Error) {
        setErro(err.message)
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
          <div className="flex justify-center mb-4">
            <TenantBrand size="md" />
          </div>
          <p className="text-gray-400">
            {isTenantHost && branding?.descricao
              ? branding.descricao
              : 'Entre na sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1"
              style={{
                borderColor: undefined,
                // @ts-expect-error CSS custom property
                '--tw-ring-color': primary,
              }}
              onFocus={e => { e.target.style.borderColor = primary }}
              onBlur={e => { e.target.style.borderColor = '' }}
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1"
              onFocus={e => { e.target.style.borderColor = primary }}
              onBlur={e => { e.target.style.borderColor = '' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: primary }}
            onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Só mostra link de registro se NÃO é tenant host (alunos não se auto-registram) */}
        {!isTenantHost && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Não tem conta?{' '}
            <button onClick={() => onNavigate('/register')} className="text-brand-400 hover:text-brand-300">Criar conta</button>
          </p>
        )}

        {/* Powered by WazeFit — só aparece em tenant host */}
        {isTenantHost && (
          <p className="text-center text-gray-600 text-xs mt-8">
            Powered by <span className="text-gray-500">WazeFit</span>
          </p>
        )}
      </div>
    </div>
  )
}
