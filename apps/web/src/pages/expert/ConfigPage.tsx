/**
 * ConfigPage - Configurações white label do tenant.
 */
import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '../../lib/api'
import type { TenantConfig } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

export function ConfigPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [nome, setNome] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#22c55e')
  const [corSecundaria, setCorSecundaria] = useState('#111827')
  const [descricao, setDescricao] = useState('')

  const load = useCallback(async () => {
    try {
      const cfg = await api.tenant.config()
      setConfig(cfg)
      setNome(cfg.nome || '')
      setCorPrimaria(cfg.cor_primaria || '#22c55e')
      setCorSecundaria(cfg.cor_secundaria || '#111827')
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    try {
      setSaving(true)
      await api.tenant.updateConfig({
        nome,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
      })
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
              <div className="mt-3 flex gap-2">
                <div style={{ backgroundColor: corPrimaria + '20', borderColor: corPrimaria + '40', color: corPrimaria }}
                  className="px-3 py-1 rounded-full text-xs border">Badge 1</div>
                <div style={{ backgroundColor: corPrimaria + '20', borderColor: corPrimaria + '40', color: corPrimaria }}
                  className="px-3 py-1 rounded-full text-xs border">Badge 2</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Info do Tenant */}
      {config && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">ℹ️ Informações</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Slug</p>
                <p className="text-white font-mono">{config.slug}</p>
              </div>
              <div>
                <p className="text-gray-500">Plano</p>
                <p className="text-white capitalize">{config.plano}</p>
              </div>
              <div>
                <p className="text-gray-500">Criado em</p>
                <p className="text-white">{new Date(config.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-gray-500">Atualizado em</p>
                <p className="text-white">{new Date(config.updated_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          💾 Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
