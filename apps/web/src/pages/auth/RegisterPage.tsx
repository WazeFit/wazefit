/**
 * Página de Registro (onboarding expert).
 */
import { useState } from 'react'
import { useAuth } from '../../stores/auth'
import { ApiClientError } from '../../lib/api'

export function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    nome_negocio: '',
    telefone: '',
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      await register(form)
      window.location.href = '/dashboard'
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErro(err.data.error)
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center font-bold text-lg">
              W
            </div>
            <span className="text-2xl font-bold">
              Waze<span className="text-brand-400">Fit</span>
            </span>
          </div>
          <p className="text-gray-400">Crie sua conta profissional</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1.5">
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              value={form.nome}
              onChange={(e) => update('nome', e.target.value)}
              placeholder="João Silva"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="nome_negocio"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Nome do negócio
            </label>
            <input
              id="nome_negocio"
              type="text"
              value={form.nome_negocio}
              onChange={(e) => update('nome_negocio', e.target.value)}
              placeholder="Studio Fitness"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-1.5">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={form.senha}
              onChange={(e) => update('senha', e.target.value)}
              placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número"
              required
              minLength={8}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-1.5">
              Telefone{' '}
              <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              id="telefone"
              type="tel"
              value={form.telefone}
              onChange={(e) => update('telefone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem conta?{' '}
          <a href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
