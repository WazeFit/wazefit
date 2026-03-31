import { useState, useEffect } from 'react'
import { Globe, ExternalLink, Trash2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { api, ApiError, type DominioTenant } from '../../lib/api'

export function DominioPage() {
  const [dominio, setDominio] = useState('')
  const [dominios, setDominios] = useState<DominioTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [verificandoId, setVerificandoId] = useState<string | null>(null)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadDominios()
  }, [])

  async function loadDominios() {
    try {
      const data = await api.dominios.list()
      setDominios(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar domínios')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!dominio.trim()) return
    setAdding(true)
    setError(null)
    setSuccess(null)

    try {
      await api.dominios.create({ dominio: dominio.trim().toLowerCase() })
      setSuccess('Domínio registrado! Aguardando verificação DNS.')
      setDominio('')
      await loadDominios()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao registrar domínio')
    } finally {
      setAdding(false)
    }
  }

  async function handleVerificar(id: string) {
    setVerificandoId(id)
    setError(null)
    setSuccess(null)

    try {
      await api.dominios.verificar(id)
      setSuccess('DNS verificado com sucesso! Domínio ativo.')
      await loadDominios()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha na verificação DNS')
    } finally {
      setVerificandoId(null)
    }
  }

  async function handleRemover(id: string) {
    if (!confirm('Tem certeza que deseja remover este domínio?')) return
    setRemovendoId(id)
    setError(null)

    try {
      await api.dominios.remove(id)
      setSuccess('Domínio removido.')
      await loadDominios()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover domínio')
    } finally {
      setRemovendoId(null)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'failed':
        return 'Falha DNS'
      default:
        return 'Pendente'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/10'
      case 'failed':
        return 'text-red-400 bg-red-500/10'
      default:
        return 'text-yellow-400 bg-yellow-500/10'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Domínio Personalizado</h1>
        <p className="text-gray-400 mt-2">Configure seu domínio próprio para o app dos alunos</p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Domínios cadastrados */}
      {!loading && dominios.length > 0 && (
        <div className="bg-dark-900/50 border border-dark-800/50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Seus Domínios</h3>
          <div className="space-y-3">
            {dominios.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700"
              >
                <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <code className="text-sm text-white">{d.dominio}</code>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                      {statusIcon(d.status)}
                      {statusLabel(d.status)}
                    </span>
                    {d.verificado_em && (
                      <span className="text-xs text-gray-500">
                        Verificado em {new Date(d.verificado_em).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {d.status !== 'active' && (
                    <button
                      onClick={() => handleVerificar(d.id)}
                      disabled={verificandoId === d.id}
                      className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Verificar DNS"
                    >
                      <RefreshCw className={`w-4 h-4 ${verificandoId === d.id ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  {d.status === 'active' && (
                    <a
                      href={`https://${d.dominio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                      title="Abrir"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleRemover(d.id)}
                    disabled={removendoId === d.id}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar domínio */}
      <div className="bg-dark-900/50 border border-dark-800/50 rounded-2xl p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Adicionar Domínio Personalizado
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={dominio}
                onChange={(e) => setDominio(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="ex: app.suaacademia.com.br"
                className="flex-1 input-pro"
              />
              <button
                onClick={handleAdd}
                disabled={!dominio.trim() || adding}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {adding ? 'Registrando...' : 'Adicionar'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Configure um CNAME no seu provedor de DNS apontando para{' '}
              <code className="bg-dark-800 px-2 py-0.5 rounded text-gray-300">wazefit.com</code>{' '}
              antes de adicionar.
            </p>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-dark-900/50 border border-dark-800/50 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Como Configurar</h3>
        <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              1
            </div>
            <div>
              <p className="text-white font-medium mb-1">Compre um domínio</p>
              <p>
                Registre um domínio em provedores como Registro.br, GoDaddy, Namecheap, etc.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              2
            </div>
            <div>
              <p className="text-white font-medium mb-1">Configure o DNS</p>
              <p>
                No painel do seu provedor, crie um registro CNAME apontando para{' '}
                <code className="bg-dark-800 px-2 py-0.5 rounded text-gray-300">
                  wazefit.com
                </code>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              3
            </div>
            <div>
              <p className="text-white font-medium mb-1">Adicione aqui</p>
              <p>
                Digite seu domínio acima e clique em "Adicionar". O sistema tentará criar o DNS automaticamente.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              4
            </div>
            <div>
              <p className="text-white font-medium mb-1">Verifique o DNS</p>
              <p>
                Se o status estiver "Pendente", clique no ícone de refresh para verificar. Pode levar até 48h para propagar.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              5
            </div>
            <div>
              <p className="text-white font-medium mb-1">Pronto!</p>
              <p>
                Seus alunos poderão acessar o app pelo seu domínio personalizado. O certificado SSL
                é gerado automaticamente pelo Cloudflare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
