import { useState, useEffect } from 'react'
import { api, type DominioTenant, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

export function DominiosPage() {
  const { toast } = useToast()
  const [dominios, setDominios] = useState<DominioTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [novoDominio, setNovoDominio] = useState('')
  const [criando, setCriando] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await api.dominios.list()
      setDominios(data)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar domínios')
    } finally {
      setLoading(false)
    }
  }

  async function handleCriar() {
    if (!novoDominio.trim()) return

    // Validação básica
    const dominio = novoDominio.trim().toLowerCase()
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) {
      toast('error', 'Domínio inválido. Use o formato: app.seudominio.com')
      return
    }

    setCriando(true)
    try {
      await api.dominios.create({ dominio })
      toast('success', '✅ Domínio configurado com sucesso!')
      setNovoDominio('')
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao criar domínio')
    } finally {
      setCriando(false)
    }
  }

  async function handleRemover(id: string) {
    if (!confirm('Tem certeza que deseja remover este domínio?')) return

    try {
      await api.dominios.remove(String(id))
      toast('success', 'Domínio removido')
      await load()
    } catch (err) {
      console.error('Erro ao remover:', err)
      toast('error', err instanceof ApiError ? err.message : 'Erro ao remover')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">🌐 Domínios Personalizados</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure seu próprio domínio para seus alunos acessarem a plataforma
        </p>
      </div>

      {/* Manual de configuração */}
      <Card>
        <CardBody>
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <div>
                <h2 className="font-semibold text-white">Como configurar meu domínio?</h2>
                <p className="text-xs text-gray-500">Clique para ver o passo a passo</p>
              </div>
            </div>
            <span className="text-gray-500">{showManual ? '▼' : '▶'}</span>
          </button>

          {showManual && (
            <div className="mt-4 space-y-4 border-t border-dark-700 pt-4">
              <div>
                <h3 className="font-semibold text-brand-400 mb-2">📋 Passo a passo:</h3>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Escolha um subdomínio</strong>
                      <p className="text-gray-400 text-xs mt-1">
                        Exemplo: <code className="bg-dark-700 px-1.5 py-0.5 rounded">app.minhaacademia.com</code>
                        {' '}ou{' '}
                        <code className="bg-dark-700 px-1.5 py-0.5 rounded">treino.seusite.com</code>
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Acesse o painel do seu domínio</strong>
                      <p className="text-gray-400 text-xs mt-1">
                        Entre no painel onde você comprou seu domínio (Registro.br, GoDaddy, Hostinger, etc.)
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
                      3
                    </span>
                    <div>
                      <strong className="text-white">Adicione um registro CNAME</strong>
                      <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 mt-2 space-y-2">
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-500 w-16">Tipo:</span>
                          <code className="text-brand-400 font-mono">CNAME</code>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-500 w-16">Nome:</span>
                          <code className="text-white font-mono">app</code>
                          <span className="text-gray-600">(ou o subdomínio que você escolheu)</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-500 w-16">Destino:</span>
                          <code className="text-emerald-400 font-mono">wazefit.com</code>
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">
                        💡 <strong>Importante:</strong> O destino deve ser exatamente{' '}
                        <code className="bg-dark-700 px-1 py-0.5 rounded">wazefit.com</code>
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
                      4
                    </span>
                    <div>
                      <strong className="text-white">Adicione o domínio aqui na WazeFit</strong>
                      <p className="text-gray-400 text-xs mt-1">
                        Use o formulário abaixo para cadastrar seu domínio. A configuração é automática!
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
                      5
                    </span>
                    <div>
                      <strong className="text-white">Aguarde a propagação</strong>
                      <p className="text-gray-400 text-xs mt-1">
                        O DNS pode levar de 5 minutos a 48 horas para propagar. Geralmente fica pronto em 15-30 minutos.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-400 mb-1">💡 Dica</h4>
                <p className="text-xs text-gray-300">
                  Não sabe onde configurar? Procure por "DNS", "Gerenciar DNS" ou "Zone Editor" no painel do seu provedor.
                  Se tiver dúvidas, entre em contato com o suporte deles.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-yellow-400 mb-1">⚠️ Atenção</h4>
                <p className="text-xs text-gray-300">
                  Não use o domínio raiz (exemplo.com) diretamente. Sempre use um subdomínio (app.exemplo.com).
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Formulário de novo domínio - apenas se não tiver nenhum */}
      {dominios.length === 0 ? (
        <Card>
          <CardBody>
            <h2 className="font-semibold text-white mb-4">➕ Adicionar Domínio Personalizado</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={novoDominio}
                onChange={(e) => setNovoDominio(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
                placeholder="app.seudominio.com"
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <Button onClick={handleCriar} loading={criando} disabled={!novoDominio.trim()}>
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Certifique-se de que o registro CNAME já está configurado antes de adicionar.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-400 mb-1">Limite de Domínios</h3>
                <p className="text-sm text-gray-300">
                  Você já possui um domínio personalizado configurado. Para adicionar um novo domínio, remova o atual primeiro.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 <strong>Plano Futuro:</strong> Múltiplos domínios estarão disponíveis em planos superiores.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Lista de domínios configurados */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-white mb-4">📋 Seus Domínios</h2>
          
          {dominios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">🌐</p>
              <p className="text-sm">Nenhum domínio personalizado configurado.</p>
              <p className="text-xs text-gray-600 mt-1">Adicione seu primeiro domínio acima!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dominios.map((dom) => (
                <div
                  key={dom.id}
                  className="flex items-center justify-between p-4 bg-dark-800/50 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={`https://${dom.dominio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-brand-400 transition-colors"
                      >
                        {dom.dominio}
                      </a>
                      <StatusBadge status={dom.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      Adicionado em {new Date(dom.criado_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Removendo domínio:', dom.id, typeof dom.id)
                      handleRemover(dom.id)
                    }}
                    className="text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors border border-red-500/30"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Informações adicionais */}
      <Card className="bg-dark-800/30">
        <CardBody>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">ℹ️ Informações Importantes</h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex gap-2">
              <span className="text-brand-400">•</span>
              <span>
                Seus alunos poderão acessar a plataforma pelo domínio personalizado
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-400">•</span>
              <span>
                O SSL (HTTPS) é configurado automaticamente pelo Cloudflare
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-400">•</span>
              <span>
                No plano atual, você pode ter 1 domínio personalizado configurado
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-400">•</span>
              <span>
                O subdomínio padrão <code className="bg-dark-700 px-1 py-0.5 rounded">*.wazefit.com</code> continua funcionando
              </span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { variant: 'success' as const, label: '✓ Ativo' },
    pending: { variant: 'default' as const, label: '⏳ Pendente' },
    error: { variant: 'danger' as const, label: '✗ Erro' },
  }

  const cfg = config[status as keyof typeof config] || config.pending

  return (
    <Badge variant={cfg.variant} className="text-xs">
      {cfg.label}
    </Badge>
  )
}