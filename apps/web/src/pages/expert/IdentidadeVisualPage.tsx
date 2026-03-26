import { useState, useEffect } from 'react'
import { Upload, Palette, Eye, Check, Dumbbell, Home, TrendingUp, User } from 'lucide-react'

/**
 * Página de Identidade Visual — 100% Profissional
 * Inspiração: Stripe, Vercel, Linear, Notion
 * 
 * Melhorias v2:
 * - Removido tab "Domínio" (não faz parte de identidade visual)
 * - Preview realista simulando app real do aluno
 * - Layout mais limpo e espaçado
 * - Tipografia melhorada
 */

type Tab = 'geral' | 'cores' | 'logo'

interface BrandConfig {
  nome: string
  tagline: string
  corPrimaria: string
  corSecundaria: string
  logoUrl: string | null
  faviconUrl: string | null
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

    const reader = new FileReader()
    reader.onload = () => {
      setConfig({ ...config, logoUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
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
      <header className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Identidade Visual
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Personalize a aparência do seu aplicativo
            </p>
          </div>

          {/* Save indicator */}
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-gray-400 flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-full">
                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
                Salvando...
              </span>
            )}
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full">
                <Check className="w-3.5 h-3.5" />
                Salvo
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-12 gap-10">
          {/* Sidebar Navigation */}
          <aside className="col-span-3">
            <nav className="space-y-2 sticky top-28">
              {[
                { id: 'geral', label: 'Geral', icon: Eye, desc: 'Nome e slogan' },
                { id: 'cores', label: 'Cores', icon: Palette, desc: 'Paleta de marca' },
                { id: 'logo', label: 'Logo & Ícone', icon: Upload, desc: 'Imagens da marca' },
              ].map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`
                      w-full text-left px-4 py-3.5 rounded-xl transition-all group
                      ${
                        active
                          ? 'bg-brand-500/10 border border-brand-500/20'
                          : 'hover:bg-dark-800/50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-5 h-5 mt-0.5 transition-colors ${
                          active ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'
                        }`}
                      />
                      <div>
                        <div
                          className={`text-sm font-medium transition-colors ${
                            active ? 'text-brand-400' : 'text-gray-300 group-hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{tab.desc}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="col-span-5 space-y-8">
            {/* Geral */}
            {activeTab === 'geral' && (
              <div className="space-y-8">
                <Section
                  title="Informações Básicas"
                  description="Nome e slogan que aparecem no aplicativo dos seus alunos"
                >
                  <div className="space-y-6">
                    <Field label="Nome do Negócio" required>
                      <input
                        type="text"
                        value={config.nome}
                        onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                        placeholder="Ex: Academia Fitness Pro"
                        className="input-pro"
                      />
                      <FieldHint>Aparece no topo do app e na tela de login</FieldHint>
                    </Field>

                    <Field label="Tagline">
                      <input
                        type="text"
                        value={config.tagline}
                        onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                        placeholder="Ex: Transforme seu corpo, transforme sua vida"
                        className="input-pro"
                        maxLength={60}
                      />
                      <FieldHint>
                        Frase curta que resume sua proposta de valor (máx. 60 caracteres)
                      </FieldHint>
                    </Field>
                  </div>
                </Section>
              </div>
            )}

            {/* Cores */}
            {activeTab === 'cores' && (
              <div className="space-y-8">
                <Section
                  title="Paleta de Cores"
                  description="Escolha as cores que representam sua marca e aparecem no app"
                >
                  <div className="space-y-8">
                    {/* Cor Primária */}
                    <Field label="Cor Primária" required>
                      <div className="flex items-start gap-4">
                        <label className="cursor-pointer group">
                          <input
                            type="color"
                            value={config.corPrimaria}
                            onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                            className="sr-only"
                          />
                          <div
                            className="w-20 h-20 rounded-2xl border-2 border-dark-700 group-hover:border-brand-500/50 transition-all shadow-lg"
                            style={{ backgroundColor: config.corPrimaria }}
                          />
                        </label>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={config.corPrimaria}
                            onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                            className="input-pro w-36 font-mono text-sm uppercase"
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                          <FieldHint>Usada em botões, links e elementos de destaque</FieldHint>
                        </div>
                      </div>
                    </Field>

                    {/* Cor Secundária */}
                    <Field label="Cor Secundária">
                      <div className="flex items-start gap-4">
                        <label className="cursor-pointer group">
                          <input
                            type="color"
                            value={config.corSecundaria}
                            onChange={(e) =>
                              setConfig({ ...config, corSecundaria: e.target.value })
                            }
                            className="sr-only"
                          />
                          <div
                            className="w-20 h-20 rounded-2xl border-2 border-dark-700 group-hover:border-brand-500/50 transition-all shadow-lg"
                            style={{ backgroundColor: config.corSecundaria }}
                          />
                        </label>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={config.corSecundaria}
                            onChange={(e) =>
                              setConfig({ ...config, corSecundaria: e.target.value })
                            }
                            className="input-pro w-36 font-mono text-sm uppercase"
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                          <FieldHint>Usada em gradientes e elementos visuais</FieldHint>
                        </div>
                      </div>
                    </Field>

                    {/* Paletas Sugeridas */}
                    <div className="pt-6 border-t border-dark-800">
                      <h4 className="text-sm font-medium text-white mb-4">Paletas Sugeridas</h4>
                      <div className="grid grid-cols-2 gap-4">
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
                            className="group text-left"
                          >
                            <div className="flex gap-2 mb-2">
                              <div
                                className="flex-1 h-16 rounded-lg transition-transform group-hover:scale-105"
                                style={{ backgroundColor: palette.primary }}
                              />
                              <div
                                className="flex-1 h-16 rounded-lg transition-transform group-hover:scale-105"
                                style={{ backgroundColor: palette.secondary }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                              {palette.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* Logo & Favicon */}
            {activeTab === 'logo' && (
              <div className="space-y-8">
                <Section title="Logo" description="Imagem principal que representa sua marca">
                  <UploadZone
                    label="Logo"
                    accept="image/png,image/jpeg,image/svg+xml"
                    preview={config.logoUrl}
                    onChange={handleLogoUpload}
                    hint="PNG, JPG ou SVG • Recomendado: 512×512px com fundo transparente"
                  />
                </Section>

                <Section
                  title="Favicon"
                  description="Ícone que aparece na aba do navegador e como atalho"
                >
                  <UploadZone
                    label="Favicon"
                    accept="image/png,image/x-icon"
                    preview={config.faviconUrl}
                    onChange={handleFaviconUpload}
                    hint="PNG ou ICO • Recomendado: 64×64px"
                    small
                  />
                </Section>
              </div>
            )}
          </main>

          {/* Preview (sticky) — Simulação realista do app */}
          <aside className="col-span-4">
            <div className="sticky top-28">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white mb-1">Preview em Tempo Real</h3>
                <p className="text-xs text-gray-500">Como seus alunos veem o app</p>
              </div>

              {/* Mockup de celular */}
              <div className="bg-dark-900 rounded-3xl p-4 border border-dark-800 shadow-2xl">
                {/* Barra de status do celular */}
                <div className="flex items-center justify-between px-6 py-2 text-xs text-gray-500 mb-2">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 border border-current rounded-sm" />
                    <div className="w-1 h-3 border border-current rounded-sm" />
                  </div>
                </div>

                {/* Tela do app */}
                <div className="bg-dark-950 rounded-2xl overflow-hidden min-h-[600px]">
                  {/* Header do app */}
                  <div
                    className="px-6 py-4 border-b border-dark-800"
                    style={{
                      background: `linear-gradient(135deg, ${config.corPrimaria}15, ${config.corSecundaria}15)`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {config.logoUrl ? (
                        <img
                          src={config.logoUrl}
                          alt="Logo"
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                          }}
                        >
                          {config.nome[0]?.toUpperCase() || 'W'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-base font-semibold text-white">{config.nome}</div>
                        {config.tagline && (
                          <div className="text-xs text-gray-400 mt-0.5">{config.tagline}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo do app */}
                  <div className="p-6 space-y-6">
                    {/* Card de treino */}
                    <div className="bg-dark-900 rounded-xl p-4 border border-dark-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${config.corPrimaria}20` }}
                        >
                          <Dumbbell className="w-5 h-5" style={{ color: config.corPrimaria }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Treino de Hoje</div>
                          <div className="text-xs text-gray-500">Peito e Tríceps</div>
                        </div>
                      </div>
                      <button
                        className="w-full py-2.5 rounded-lg font-medium text-white text-sm transition-transform active:scale-95 shadow-lg"
                        style={{ backgroundColor: config.corPrimaria }}
                      >
                        Iniciar Treino
                      </button>
                    </div>

                    {/* Card de progresso */}
                    <div className="bg-dark-900 rounded-xl p-4 border border-dark-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-white">Seu Progresso</div>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: '65%',
                            background: `linear-gradient(90deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2">65% da meta semanal</div>
                    </div>
                  </div>

                  {/* Bottom navigation */}
                  <div className="absolute bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 px-6 py-3">
                    <div className="flex items-center justify-around">
                      {[
                        { icon: Home, label: 'Início', active: true },
                        { icon: Dumbbell, label: 'Treinos', active: false },
                        { icon: TrendingUp, label: 'Progresso', active: false },
                        { icon: User, label: 'Perfil', active: false },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="flex flex-col items-center gap-1">
                            <Icon
                              className="w-5 h-5"
                              style={{
                                color: item.active ? config.corPrimaria : '#6b7280',
                              }}
                            />
                            <span
                              className="text-xs"
                              style={{
                                color: item.active ? config.corPrimaria : '#6b7280',
                              }}
                            >
                              {item.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
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

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-dark-900/50 border border-dark-800/50 rounded-2xl p-8">
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-3">
        {label}
        {required && <span className="text-red-400 ml-1.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-600 mt-2 leading-relaxed">{children}</p>
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
          border-2 border-dashed border-dark-700 rounded-2xl cursor-pointer
          hover:border-brand-500/50 hover:bg-dark-800/30 transition-all
          ${small ? 'p-6' : 'p-10'}
        `}
        >
          {preview ? (
            <div className="flex items-center gap-6">
              <img
                src={preview}
                alt={label}
                className={`${
                  small ? 'w-20 h-20' : 'w-28 h-28'
                } rounded-xl object-cover border border-dark-700`}
              />
              <div className="text-left">
                <p className="text-sm font-medium text-white mb-1">Imagem carregada</p>
                <p className="text-xs text-gray-500">Clique para trocar</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Clique para fazer upload</p>
              <p className="text-xs text-gray-600 leading-relaxed">{hint}</p>
            </div>
          )}
        </div>
      </label>
    </div>
  )
}