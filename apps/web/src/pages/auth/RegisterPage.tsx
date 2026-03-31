/**
 * Página de Registro — com suporte a white label.
 * Em contexto de tenant, redireciona para login (alunos não se auto-registram).
 */
import { useState } from 'react'
import { register } from '../../stores/auth'
import type { User, Tenant } from '../../stores/auth'
import { TenantBrand, useTenantColors } from '../../components/ui/TenantBrand'
import { useTenant } from '../../contexts/TenantContext'

interface Props {
  onSuccess: (user: User, tenant: Tenant) => void
  onNavigate: (path: string) => void
}

export function RegisterPage({ onSuccess, onNavigate }: Props) {
  const [nome, setNome] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { primary } = useTenantColors()
  const { isTenantHost } = useTenant()

  // Em tenant host, alunos não se registram — redirecionar para login
  if (isTenantHost) {
    onNavigate('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const result = await register({
        nome,
        email,
        senha,
        nome_negocio: nomeNegocio,
        telefone: telefone || undefined,
      })
      onSuccess(result.user, result.tenant)
    } catch (err) {
      if (err instanceof Error) {
        setErro(err.message)
      } else {
        setErro('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TenantBrand size="md" />
          </div>
          <p className="text-gray-400">Crie sua conta profissional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1.5">Seu nome</label>
            <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <div>
            <label htmlFor="nome_negocio" className="block text-sm font-medium text-gray-300 mb-1.5">Nome do negócio</label>
            <input id="nome_negocio" type="text" value={nomeNegocio} onChange={e => setNomeNegocio(e.target.value)} placeholder="Studio Fitness" required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <div>
            <label htmlFor="reg-senha" className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <input id="reg-senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 8 chars, 1 maiúscula, 1 número" required minLength={8}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-1.5">
              Telefone <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input id="telefone" type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: primary }}
            onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1' }}
          >
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem conta?{' '}
          <button onClick={() => onNavigate('/login')} className="text-brand-400 hover:text-brand-300">Entrar</button>
        </p>
      </div>
    </div>
  )
}
