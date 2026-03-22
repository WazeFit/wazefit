/**
 * Página de Registro.
 */
import { useState } from 'react'
import { register } from '../../stores/auth'
import type { User, Tenant } from '../../stores/auth'

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
      // Chamar callback de sucesso — o App cuida do redirect
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
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center font-bold text-lg">W</div>
            <span className="text-2xl font-bold text-white">Waze<span className="text-brand-400">Fit</span></span>
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

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
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
