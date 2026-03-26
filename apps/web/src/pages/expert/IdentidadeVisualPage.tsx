import { useState, useEffect } from 'react'
import { Upload, Palette, Globe, Check, AlertCircle, Eye } from 'lucide-react'

/**
 * Página de Identidade Visual — padrão Big Tech
 * Inspiração: Stripe, Vercel, Linear, Notion
 * 
 * Features:
 * - Sidebar de navegação (Geral, Cores, Logo, Domínio)
 * - Preview em tempo real (sticky)
 * - Auto-save com feedback visual
 * - Validação inline
 * - Upload de logo/favicon com preview
 */

type Tab = 'geral' | 'cores' | 'logo' | 'dominio'

interface BrandConfig {
  nome: string
  tagline: string
  corPrimaria: string
  corSecundaria: string
  logoUrl: string | null
  faviconUrl: string | null
  dominio: string | null
}

export default function IdentidadeVisualPage() {
  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [config, setConfig] = useState<BrandConfig>({
    nome: 'Minha Academia',
    tagline: 'Transforme seu corpo, transforme sua vida',
    corPrimaria: '#6366f1',
    corSecundaria: '#8b5cf6',
    logoUrl: null,
    faviconUrl: null,
    dominio: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Auto-save (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (saved) return
      handleSave()
    }, 2000)
    return () => clearTimeout(timer)
  }, [config])

  const handleSave = async () => {
    setSaving(true)
    // TODO: API call
    await new Promise((r) => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local
    const reader = new FileReader()
    reader.onload = () => {
      setConfig({ ...config, logoUrl: reader.result as string })
    }
    reader.readAsDataURL(file)

    // TODO: Upload para R2
  }

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setConfig({ ...config, faviconUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Identidade Visual</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Personalize a aparência do seu aplicativo
            </p>
          </div>

          {/* Save indicator */}
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-gray-500 flex items-center gap-2">
                <div className="w-1 h-1 bg-brand-400 rounded-full animate-pulse" />
                Salvando...
              </span>
            )}
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-3 h-3" />
                Salvo
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className="col-span-3">
            <nav className="space-y-1 sticky top-24">
              {[
                { id: 'geral', label: 'Geral', icon: Eye },
                { id: 'cores', label: 'Cores', icon: Palette },
                { id: 'logo', label: 'Logo & Favicon', icon: Upload },
                { id: 'dominio', label: 'Domínio', icon: Globe },
              ].map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${
                        active
                          ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-dark-800'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="col-span-6 space-y-6">
            {/* Geral */}
            {activeTab === 'geral' && (
              <div className="space-y-6">
                <Card title="Informações Básicas" description="Nome e slogan do seu negócio">
                  <div className="space-y-4">
                    <Field label="Nome do Negócio" required>
                      <input
                        type="text"
                        value={config.nome}
                        onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                        placeholder="Ex: Academia Fitness Pro"
                        className="input"
                      />
                      <FieldHint>Aparece no topo do app e na página de login</FieldHint>
                    </Field>

                    <Field label="Tagline" optional>
                      <input
                        type="text"
                        value={config.tagline}
                        onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                        placeholder="Ex: Transforme seu corpo, transforme sua vida"
                        className="input"
                      />
                      <FieldHint>Frase curta que resume sua proposta de valor</FieldHint>
                    </Field>
                  </div>
                </Card>
              </div>
            )}

            {/* Cores */}
            {activeTab === 'cores' && (
              <div className="space-y-6">
                <Card
                  title="Paleta de Cores"
                  description="Escolha as cores que representam sua marca"
                >
                  <div className="space-y-6">
                    <Field label="Cor Primária" required>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.corPrimaria}
                          onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                          className="w-16 h-16 rounded-lg border-2 border-dark-700 cursor-pointer"
                        />
                        <div>
                          <input
                            type="text"
                            value={config.corPrimaria}
                            onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                            className="input w-32 font-mono text-sm"
                          />
                          <FieldHint>Usada em botões e destaques</FieldHint>
                        </div>
                      </div>
                    </Field>

                    <Field label="Cor Secundária" optional>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.corSecundaria}
                          onChange={(e) =>
                            setConfig({ ...config, corSecundaria: e.target.value })
                          }
                          className="w-16 h-16 rounded-lg border-2 border-dark-700 cursor-pointer"
                        />
                        <div>
                          <input
                            type="text"
                            value={config.corSecundaria}
                            onChange={(e) =>
                              setConfig({ ...config, corSecundaria: e.target.value })
                            }
                            className="input w-32 font-mono text-sm"
                          />
                          <FieldHint>Gradientes e elementos visuais</FieldHint>
                        </div>
                      </div>
                    </Field>

                    {/* Paleta sugerida */}
                    <div className="mt-6 pt-6 border-t border-dark-800">
                      <h4 className="text-sm font-medium text-white mb-3">Paletas Sugeridas</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { name: 'Indigo', primary: '#6366f1', secondary: '#8b5cf6' },
                          { name: 'Emerald', primary: '#10b981', secondary: '#14b8a6' },
                          { name: 'Rose', primary: '#f43f5e', secondary: '#ec4899' },
                          { name: 'Amber', primary: '#f59e0b', secondary: '#f97316' },
                        ].map((palette) => (
                          <button
                            key={palette.name}
                            onClick={() =>
                              setConfig({
                                ...config,
                                corPrimaria: palette.primary,
                                corSecundaria: palette.secondary,
                              })
                            }
                            className="group"
                          >
                            <div className="flex gap-1 mb-1.5">
                              <div
                                className="w-full h-10 rounded-md"
                                style={{ backgroundColor: palette.primary }}
                              />
                              <div
                                className="w-full h-10 rounded-md"
                                style={{ backgroundColor: palette.secondary }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 group-hover:text-white transition-colors">
                              {palette.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Logo & Favicon */}
            {activeTab === 'logo' && (
              <div className="space-y-6">
                <Card title="Logo" description="Imagem principal da sua marca">
                  <div className="space-y-4">
                    <UploadZone
                      label="Logo"
                      accept="image/png,image/jpeg,image/svg+xml"
                      preview={config.logoUrl}
                      onChange={handleLogoUpload}
                      hint="PNG, JPG ou SVG. Recomendado: 512x512px, fundo transparente"
                    />
                  </div>
                </Card>

                <Card title="Favicon" description="Ícone que aparece na aba do navegador">
                  <div className="space-y-4">
                    <UploadZone
                      label="Favicon"
                      accept="image/png,image/x-icon"
                      preview={config.faviconUrl}
                      onChange={handleFaviconUpload}
                      hint="PNG ou ICO. Recomendado: 32x32px ou 64x64px"
                      small
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* Domínio */}
            {activeTab === 'dominio' && (
              <div className="space-y-6">
                <Card
                  title="Domínio Personalizado"
                  description="Configure seu domínio próprio (ex: app.suamarca.com)"
                >
                  <div className="space-y-4">
                    <Field label="Domínio Atual">
                      <div className="flex items-center gap-2 px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <code className="text-sm text-gray-400">
                          {config.dominio || 'academia-fit.wazefit.com'}
                        </code>
                      </div>
                    </Field>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium text-white mb-1">
                            Quer usar seu próprio domínio?
                          </p>
                          <p>
                            Acesse <strong>Negócio → Domínios</strong> para configurar um domínio
                            personalizado como <code>app.suamarca.com</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </main>

          {/* Preview (sticky) */}
          <aside className="col-span-3">
            <div className="sticky top-24">
              <Card title="Preview" description="Como ficará para seus alunos">
                <div className="space-y-4">
                  {/* App Header Preview */}
                  <div className="p-4 bg-dark-900 border border-dark-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                          }}
                        >
                          {config.nome[0]?.toUpperCase() || 'W'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white">{config.nome}</div>
                        {config.tagline && (
                          <div className="text-xs text-gray-500">{config.tagline}</div>
                        )}
                      </div>
                    </div>

                    {/* Button Preview */}
                    <button
                      className="w-full py-2.5 rounded-lg font-medium text-white text-sm transition-transform active:scale-95"
                      style={{ backgroundColor: config.corPrimaria }}
                    >
                      Botão Primário
                    </button>
                  </div>

                  {/* Gradient Preview */}
                  <div
                    className="h-32 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                    }}
                  />
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Componentes Auxiliares
// ═══════════════════════════════════════════════════════════════

function Card({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {optional && <span className="text-gray-600 ml-2 font-normal">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-600 mt-1.5">{children}</p>
}

function UploadZone({
  label,
  accept,
  preview,
  onChange,
  hint,
  small,
}: {
  label: string
  accept: string
  preview: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hint: string
  small?: boolean
}) {
  return (
    <div>
      <label className="block">
        <input type="file" accept={accept} onChange={onChange} className="hidden" />
        <div
          className={`
          border-2 border-dashed border-dark-700 rounded-lg cursor-pointer
          hover:border-brand-500/50 hover:bg-dark-800/50 transition-all
          ${small ? 'p-4' : 'p-8'}
        `}
        >
          {preview ? (
            <div className="flex items-center gap-4">
              <img
                src={preview}
                alt={label}
                className={`${small ? 'w-16 h-16' : 'w-24 h-24'} rounded-lg object-cover`}
              />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Imagem carregada</p>
                <p className="text-xs text-gray-500 mt-0.5">Clique para trocar</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Clique para fazer upload</p>
              <p className="text-xs text-gray-600 mt-1">{hint}</p>
            </div>
          )}
        </div>
      </label>
    </div>
  )
}