import { useState, useEffect, useCallback } from 'react'
import { Upload, Palette, Eye, Check, Dumbbell, Home, TrendingUp, User } from 'lucide-react'
import { api, ApiError } from '../../lib/api'

/**
 * Página de Identidade Visual — 100% Profissional
 * Inspiração: Stripe, Vercel, Linear, Notion
 * 
 * Conectado com API real:
 * - GET /api/v1/tenant/config → carrega configurações
 * - PUT /api/v1/tenant/config → salva cores/nome/tagline
 * - POST /api/v1/tenant/branding/upload → upload logo/favicon
 */

type Tab = 'geral' | 'cores' | 'logo'

const BASE = import.meta.env.VITE_API_URL || 'https://api.wazefit.com'

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
    nome: '',
    tagline: '',
    corPrimaria: '#6366f1',
    corSecundaria: '#8b5cf6',
    logoUrl: null,
    faviconUrl: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar config da API
  useEffect(() => {
    async function load() {
      try {
        const data = await api.tenant.config()
        const cfg = data.config || {}
        setConfig({
          nome: cfg.nome_exibicao || '',
          tagline: cfg.descricao || '',
          corPrimaria: cfg.cor_primaria || '#6366f1',
          corSecundaria: cfg.cor_secundaria || '#8b5cf6',
          logoUrl: cfg.logo_url ? (cfg.logo_url.startsWith('/') ? `${BASE}${cfg.logo_url}` : cfg.logo_url) : null,
          faviconUrl: cfg.favicon_url ? (cfg.favicon_url.startsWith('/') ? `${BASE}${cfg.favicon_url}` : cfg.favicon_url) : null,
        })
        setLoaded(true)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar configurações')
        setLoaded(true)
      }
    }
    load()
  }, [])

  const handleSave = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await api.tenant.updateConfig({
        nome_exibicao: config.nome,
        descricao: config.tagline,
        cor_primaria: config.corPrimaria,
        cor_secundaria: config.corSecundaria,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }, [config, saving])

  // Auto-save debounced (somente após carregamento inicial)
  useEffect(() => {
    if (!loaded) return
    setSaved(false)
    const timer = setTimeout(() => {
      handleSave()
    }, 2000)
    return () => clearTimeout(timer)
  }, [config.nome, config.tagline, config.corPrimaria, config.corSecundaria])

  async function uploadBranding(file: File, tipo: 'logo' | 'favicon') {
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
    return data.url.startsWith('/') ? `${BASE}${data.url}` : data.url
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const url = await uploadBranding(file, 'logo')
      setConfig({ ...config, logoUrl: url })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar logo')
    } finally {
      setSaving(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const url = await uploadBranding(file, 'favicon')
      setConfig({ ...config, faviconUrl: url })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar favicon')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
            {error && (
              <span className="text-xs text-red-400 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
                ⚠️ {error}
              </span>
            )}
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

          {/* Preview (sticky) — Simulação ULTRA realista */}
          <aside className="col-span-4">
            <div className="sticky top-28">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-1">Preview em Tempo Real</h3>
                <p className="text-xs text-gray-500">Exatamente como seus alunos veem</p>
              </div>

              {/* Mockup de celular — iPhone style */}
              <div className="relative mx-auto" style={{ width: '320px' }}>
                {/* Moldura do celular */}
                <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  {/* Notch (entalhe do iPhone) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

                  {/* Tela do celular */}
                  <div className="bg-dark-950 rounded-[2.5rem] overflow-hidden relative" style={{ height: '650px' }}>
                    {/* Barra de status */}
                    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 text-xs text-gray-400 z-20">
                      <span className="font-semibold">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="w-6 h-3 border-2 border-current rounded-sm relative">
                          <div className="absolute inset-0.5 bg-current rounded-sm" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo scrollável */}
                    <div className="pt-12 pb-20 h-full overflow-y-auto">
                      {/* Header do app */}
                      <div
                        className="px-5 py-6 border-b border-dark-800/50"
                        style={{
                          background: `linear-gradient(135deg, ${config.corPrimaria}12, ${config.corSecundaria}12)`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {config.logoUrl ? (
                            <img
                              src={config.logoUrl}
                              alt="Logo"
                              className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg"
                              style={{
                                background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                              }}
                            >
                              {config.nome[0]?.toUpperCase() || 'W'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-bold text-white truncate">
                              {config.nome || 'Minha Academia'}
                            </div>
                            {config.tagline && (
                              <div className="text-xs text-gray-400 mt-0.5 truncate">
                                {config.tagline}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do app */}
                      <div className="p-5 space-y-5">
                        {/* Saudação */}
                        <div>
                          <h2 className="text-lg font-bold text-white">Olá, João! 👋</h2>
                          <p className="text-sm text-gray-400 mt-1">
                            Pronto para treinar hoje?
                          </p>
                        </div>

                        {/* Card de treino — DESTAQUE */}
                        <div
                          className="rounded-2xl p-5 border shadow-xl"
                          style={{
                            background: `linear-gradient(135deg, ${config.corPrimaria}15, ${config.corSecundaria}08)`,
                            borderColor: `${config.corPrimaria}30`,
                          }}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                              style={{
                                backgroundColor: config.corPrimaria,
                              }}
                            >
                              <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white">Treino de Hoje</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                Peito e Tríceps • 45 min
                              </div>
                            </div>
                          </div>
                          <button
                            className="w-full py-3 rounded-xl font-semibold text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                            style={{
                              background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                            }}
                          >
                            Iniciar Treino
                          </button>
                        </div>

                        {/* Card de progresso */}
                        <div className="bg-dark-900/50 rounded-2xl p-5 border border-dark-800">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-sm font-bold text-white">Seu Progresso</div>
                              <div className="text-xs text-gray-500 mt-0.5">Esta semana</div>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-semibold">+12%</span>
                            </div>
                          </div>
                          <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 shadow-lg"
                              style={{
                                width: '65%',
                                background: `linear-gradient(90deg, ${config.corPrimaria}, ${config.corSecundaria})`,
                                boxShadow: `0 0 12px ${config.corPrimaria}60`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">3 de 5 treinos</span>
                            <span className="text-xs font-semibold text-white">65%</span>
                          </div>
                        </div>

                        {/* Cards de stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-800">
                            <div className="text-2xl font-bold text-white mb-1">127</div>
                            <div className="text-xs text-gray-500">Treinos feitos</div>
                          </div>
                          <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-800">
                            <div className="text-2xl font-bold text-white mb-1">8.2kg</div>
                            <div className="text-xs text-gray-500">Peso perdido</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom navigation — FIXO */}
                    <div className="absolute bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800/50 px-5 py-3 safe-area-bottom">
                      <div className="flex items-center justify-around">
                        {[
                          { icon: Home, label: 'Início', active: true },
                          { icon: Dumbbell, label: 'Treinos', active: false },
                          { icon: TrendingUp, label: 'Progresso', active: false },
                          { icon: User, label: 'Perfil', active: false },
                        ].map((item) => {
                          const Icon = item.icon
                          return (
                            <button
                              key={item.label}
                              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
                            >
                              <Icon
                                className="w-5 h-5 transition-colors"
                                style={{
                                  color: item.active ? config.corPrimaria : '#6b7280',
                                }}
                              />
                              <span
                                className="text-xs font-medium transition-colors"
                                style={{
                                  color: item.active ? config.corPrimaria : '#6b7280',
                                }}
                              >
                                {item.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
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
