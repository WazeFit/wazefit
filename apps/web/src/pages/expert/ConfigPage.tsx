/**
 * ConfigPage - Configurações white label do tenant.
 */
import { useState, useEffect, useCallback } from 'react'
import { api, ApiError, type DominioTenant } from '../../lib/api'
import { getSavedTenant } from '../../stores/auth'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

export function ConfigPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [nome, setNome] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#22c55e')
  const [corSecundaria, setCorSecundaria] = useState('#111827')
  const [descricao, setDescricao] = useState('')

  // Domínios
  const [dominios, setDominios] = useState<DominioTenant[]>([])
  const [novoDominio, setNovoDominio] = useState('')
  const [addingDominio, setAddingDominio] = useState(false)
  const [verificandoId, setVerificandoId] = useState<string | null>(null)
  const tenantSlug = getSavedTenant()?.slug || ''

  const loadDominios = useCallback(async () => {
    try {
      const list = await api.dominios.list()
      setDominios(list)
    } catch {
      // silently fail — dominios section is secondary
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await api.tenant.config()
      const cfg = res.config || {}
      setNome(cfg['nome_exibicao'] || '')
      setCorPrimaria(cfg['cor_primaria'] || '#22c55e')
      setCorSecundaria(cfg['cor_secundaria'] || '#111827')
      setDescricao(cfg['descricao'] || '')
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load(); loadDominios() }, [load, loadDominios])

  async function handleAddDominio() {
    if (!novoDominio.trim()) return
    try {
      setAddingDominio(true)
      await api.dominios.create({ dominio: novoDominio.trim().toLowerCase() })
      toast('success', 'Domínio adicionado! Configure o CNAME e verifique.')
      setNovoDominio('')
      await loadDominios()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao adicionar domínio')
    } finally {
      setAddingDominio(false)
    }
  }

  async function handleVerificar(id: string) {
    try {
      setVerificandoId(id)
      const res = await api.dominios.verificar(id)
      if (res.verificado) {
        toast('success', 'DNS verificado com sucesso! Domínio ativo.')
      } else {
        toast('info', 'DNS ainda não aponta corretamente. Verifique a configuração.')
      }
      await loadDominios()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Falha na verificação DNS')
      await loadDominios()
    } finally {
      setVerificandoId(null)
    }
  }

  async function handleRemoverDominio(id: string) {
    try {
      await api.dominios.remove(id)
      toast('success', 'Domínio removido')
      await loadDominios()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao remover domínio')
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      await api.tenant.updateConfig({
        nome_exibicao: nome || undefined,
        cor_primaria: corPrimaria || undefined,
        cor_secundaria: corSecundaria || undefined,
        descricao: descricao || undefined,
      } as Record<string, string | null>)
      toast('success', 'Configurações salvas com sucesso')
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-gray-400 mt-1">Personalize sua plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">🎨 Identidade Visual</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input label="Nome de Exibição" placeholder="Nome do seu negócio"
            value={nome} onChange={e => setNome(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cor Primária</label>
              <div className="flex items-center gap-3">
                <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent" />
                <Input value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cor Secundária</label>
              <div className="flex items-center gap-3">
                <input type="color" value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent" />
                <Input value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>

          <Textarea label="Descrição" placeholder="Descreva seu negócio..."
            value={descricao} onChange={e => setDescricao(e.target.value)} />
        </CardBody>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">👁 Preview</h2>
        </CardHeader>
        <CardBody>
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <div style={{ backgroundColor: corPrimaria }} className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: corSecundaria, color: corPrimaria }}>
                  {nome.charAt(0) || 'W'}
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{nome || 'Seu Negócio'}</p>
                  {descricao && <p className="text-sm text-white/70">{descricao}</p>}
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: corSecundaria }} className="px-6 py-4">
              <div className="flex gap-3">
                <div style={{ backgroundColor: corPrimaria }} className="px-4 py-2 rounded-lg text-white text-sm font-medium">
                  Botão Primário
                </div>
                <div className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: corPrimaria, color: corPrimaria }}>
                  Botão Secundário
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          💾 Salvar Configurações
        </Button>
      </div>

      {/* Domínio Personalizado */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">🌐 Domínio Personalizado</h2>
        </CardHeader>
        <CardBody className="space-y-5">
          {/* Subdomínio atual */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Subdomínio WazeFit</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-dark-800 border border-gray-700 rounded-lg text-gray-300 text-sm">
                {tenantSlug ? `${tenantSlug}.wazefit.com` : 'Carregando...'}
              </div>
              <Badge variant="success">Ativo</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Sempre disponível — seus alunos podem acessar por este endereço.</p>
          </div>

          {/* Domínios custom */}
          {dominios.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Domínios Personalizados</label>
              <div className="space-y-2">
                {dominios.map(d => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-gray-700 rounded-lg">
                    <span className="flex-1 text-sm text-white">{d.dominio}</span>
                    <Badge variant={d.status === 'active' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                      {d.status === 'active' ? 'Ativo' : d.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleVerificar(d.id)}
                      loading={verificandoId === d.id}
                    >
                      Verificar DNS
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoverDominio(d.id)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar domínio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Adicionar Domínio</label>
            <div className="flex gap-2">
              <Input
                placeholder="app.seudominio.com"
                value={novoDominio}
                onChange={e => setNovoDominio(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDominio()}
                className="flex-1"
              />
              <Button onClick={handleAddDominio} loading={addingDominio}>
                Adicionar
              </Button>
            </div>
          </div>

          {/* Instruções DNS */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-400 mb-2">📋 Como configurar seu domínio</h3>
            <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>Acesse o painel DNS do seu provedor de domínio</li>
              <li>Adicione um registro <strong className="text-gray-300">CNAME</strong> apontando para <code className="bg-dark-800 px-1.5 py-0.5 rounded text-blue-300">wazefit.com</code></li>
              <li>Exemplo: <code className="bg-dark-800 px-1.5 py-0.5 rounded text-gray-300">app.seudominio.com</code> → <code className="bg-dark-800 px-1.5 py-0.5 rounded text-gray-300">CNAME</code> → <code className="bg-dark-800 px-1.5 py-0.5 rounded text-blue-300">wazefit.com</code></li>
              <li>Aguarde a propagação DNS (pode levar até 24h)</li>
              <li>Clique em <strong className="text-gray-300">"Verificar DNS"</strong> para ativar</li>
            </ol>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
