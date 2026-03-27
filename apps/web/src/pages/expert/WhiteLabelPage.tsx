import { useState, useEffect } from 'react'
import { api, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

interface WhiteLabelConfig {
  logo_url?: string
  favicon_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  nome_exibicao?: string
  descricao?: string
}

const BASE = import.meta.env.VITE_API_URL || 'https://api.wazefit.com'

export function WhiteLabelPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<WhiteLabelConfig>({
    cor_primaria: '#FF6B35',
    cor_secundaria: '#004E89',
    nome_exibicao: '',
    descricao: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await api.tenant.config()
      const cfg = data.config || {}
      setConfig({
        cor_primaria: cfg.cor_primaria || '#FF6B35',
        cor_secundaria: cfg.cor_secundaria || '#004E89',
        nome_exibicao: cfg.nome_exibicao || '',
        descricao: cfg.descricao || '',
        logo_url: cfg.logo_url || undefined,
        favicon_url: cfg.favicon_url || undefined,
      })
      if (cfg.logo_url) setLogoPreview(cfg.logo_url.startsWith('/') ? `${BASE}${cfg.logo_url}` : cfg.logo_url)
      if (cfg.favicon_url) setFaviconPreview(cfg.favicon_url.startsWith('/') ? `${BASE}${cfg.favicon_url}` : cfg.favicon_url)
      setLoading(false)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar configurações')
      setLoading(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast('error', 'Selecione uma imagem válida')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Imagem muito grande. Máximo 2MB')
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast('error', 'Selecione uma imagem válida')
      return
    }

    if (file.size > 512 * 1024) {
      toast('error', 'Imagem muito grande. Máximo 512KB')
      return
    }

    setFaviconFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setFaviconPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadFile(file: File, tipo: 'logo' | 'favicon'): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tipo', tipo)

    const token = localStorage.getItem('wf_token')
    const res = await fetch(`${BASE}/api/v1/tenant/branding/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new ApiError(res.status, data)
    }

    const data = await res.json() as { url: string }
    return data.url
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Upload de arquivos primeiro (se houver)
      if (logoFile) {
        await uploadFile(logoFile, 'logo')
      }
      if (faviconFile) {
        await uploadFile(faviconFile, 'favicon')
      }

      // Salvar configs de texto/cores
      await api.tenant.updateConfig({
        cor_primaria: config.cor_primaria,
        cor_secundaria: config.cor_secundaria,
        nome_exibicao: config.nome_exibicao,
        descricao: config.descricao,
      })

      toast('success', '✅ Configurações salvas! Recarregue a página para ver as mudanças.')
      setLogoFile(null)
      setFaviconFile(null)
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">🎨 Identidade Visual (White Label)</h1>
        <p className="text-gray-400 text-sm mt-1">
          Personalize a plataforma com sua marca. Essas configurações aparecem quando seus alunos acessam via domínio personalizado.
        </p>
      </div>

      {/* Preview */}
      <Card className="bg-gradient-to-br from-brand-500/10 to-purple-500/10 border-brand-500/20">
        <CardBody>
          <h2 className="font-semibold text-white mb-4">👀 Preview</h2>
          <div
            className="bg-dark-900 rounded-lg p-6 border-2"
            style={{ borderColor: config.cor_primaria || '#FF6B35' }}
          >
            <div className="flex items-center gap-4 mb-4">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
              )}
              <h3 className="text-2xl font-bold" style={{ color: config.cor_primaria || '#FF6B35' }}>
                {config.nome_exibicao || 'WazeFit'}
              </h3>
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: config.cor_primaria || '#FF6B35',
                  color: 'white',
                }}
              >
                Botão Primário
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: config.cor_secundaria || '#004E89',
                  color: 'white',
                }}
              >
                Botão Secundário
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Logo */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-white mb-4">📷 Logo</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Upload do logo (PNG, SVG, JPG - máx 2MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-brand-500 file:text-white
                  hover:file:bg-brand-600
                  file:cursor-pointer cursor-pointer"
              />
            </div>
            {logoPreview && (
              <div className="bg-dark-800 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-h-24 w-auto object-contain"
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              💡 Recomendado: PNG transparente, 512x512px ou maior
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Favicon */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-white mb-4">🔖 Favicon</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Upload do favicon (PNG, ICO - máx 512KB)
              </label>
              <input
                type="file"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                onChange={handleFaviconChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-brand-500 file:text-white
                  hover:file:bg-brand-600
                  file:cursor-pointer cursor-pointer"
              />
            </div>
            {faviconPreview && (
              <div className="bg-dark-800 rounded-lg p-4 flex items-center gap-3">
                <img
                  src={faviconPreview}
                  alt="Favicon preview"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-sm text-gray-400">Preview do favicon</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              💡 Recomendado: 32x32px ou 64x64px, PNG transparente
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Cores */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-white mb-4">🎨 Cores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cor Primária</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.cor_primaria}
                  onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer border border-dark-600"
                />
                <input
                  type="text"
                  value={config.cor_primaria}
                  onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                  placeholder="#FF6B35"
                  className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Botões, links, destaques</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Cor Secundária</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.cor_secundaria}
                  onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer border border-dark-600"
                />
                <input
                  type="text"
                  value={config.cor_secundaria}
                  onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                  placeholder="#004E89"
                  className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Botões secundários, bordas</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Nome da Plataforma */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-white mb-4">✏️ Nome da Plataforma</h2>
          <input
            type="text"
            value={config.nome_exibicao}
            onChange={(e) => setConfig({ ...config, nome_exibicao: e.target.value })}
            placeholder="Ex: Minha Academia Fit"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white"
          />
          <p className="text-xs text-gray-500 mt-2">
            Aparece no título da página, emails e notificações
          </p>
        </CardBody>
      </Card>

      {/* Descrição */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-white mb-4">📝 Descrição</h2>
          <textarea
            value={config.descricao}
            onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
            placeholder="Ex: A melhor plataforma de treinos personalizados"
            rows={3}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Aparece na tela de login e meta tags do site
          </p>
        </CardBody>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={load}>
          Cancelar
        </Button>
        <Button onClick={handleSave} loading={saving}>
          💾 Salvar Configurações
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardBody>
          <h3 className="text-sm font-semibold text-blue-400 mb-2">ℹ️ Informações Importantes</h3>
          <ul className="space-y-1.5 text-xs text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>As configurações aparecem apenas quando acessado via domínio personalizado</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Seus alunos verão sua marca ao invés da WazeFit</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Após salvar, pode levar alguns minutos para propagar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Teste em uma aba anônima após configurar</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
