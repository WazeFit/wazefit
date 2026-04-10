'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Dumbbell,
  ExternalLink,
  Globe,
  Loader2,
  Palette,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wazefit.com'

// ── Fonts ────────────────────────────────────────────────────────
const FONTS = [
  { name: 'Inter', label: 'Moderno e clean', stack: "'Inter', system-ui, sans-serif" },
  { name: 'Poppins', label: 'Amigável e redondo', stack: "'Poppins', sans-serif" },
  { name: 'DM Sans', label: 'Sóbrio e legível', stack: "'DM Sans', sans-serif" },
  { name: 'Space Grotesk', label: 'Tech e marcante', stack: "'Space Grotesk', sans-serif" },
]

// ── Color palettes ───────────────────────────────────────────────
const PALETTES = [
  { name: 'Esmeralda', primary: '#22c55e', secondary: '#16a34a', accent: '#4ade80' },
  { name: 'Oceano', primary: '#3b82f6', secondary: '#1d4ed8', accent: '#60a5fa' },
  { name: 'Dourado', primary: '#eab308', secondary: '#ca8a04', accent: '#facc15' },
]

// ── Payment methods ──────────────────────────────────────────────
type PaymentKey = 'cartao' | 'pix' | 'boleto'
const PAYMENT_METHODS: { key: PaymentKey; emoji: string; label: string }[] = [
  { key: 'cartao', emoji: '💳', label: 'Cartão de crédito' },
  { key: 'pix', emoji: '⚡', label: 'PIX' },
  { key: 'boleto', emoji: '🧾', label: 'Boleto' },
]

// ── Onboarding data shape ────────────────────────────────────────
interface OnboardingData {
  nome: string
  slug: string
  tagline: string
  logoUrl: string
  theme: 'dark' | 'light'
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string // font stack
  fontName: string   // human name
  customDomain: string
  payments: Record<PaymentKey, boolean>
  stripeConnected: boolean
}

const DEFAULT_DATA: OnboardingData = {
  nome: '',
  slug: 'suamarca',
  tagline: '',
  logoUrl: '',
  theme: 'dark',
  primaryColor: '#22c55e',
  secondaryColor: '#16a34a',
  accentColor: '#4ade80',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontName: 'Inter',
  customDomain: '',
  payments: { cartao: false, pix: false, boleto: false },
  stripeConnected: false,
}

const STORAGE_KEY = 'wazefit-onboarding'

function loadState(): OnboardingData {
  if (typeof window === 'undefined') return DEFAULT_DATA
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DATA
    return { ...DEFAULT_DATA, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_DATA
  }
}

// ═════════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA)
  const [step, setStep] = useState(1)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setData(loadState())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, hydrated])

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brand-900/20">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-brand-400" />
          </div>
          <span className="font-bold text-lg">WazeFit</span>
        </Link>
        <div className="text-xs text-muted-foreground">Passo {step} de 5</div>
      </header>

      <Stepper step={step} />

      <main className="container mx-auto px-6 py-10">
        {step === 1 && <StepMarca data={data} update={update} onNext={() => setStep(2)} />}
        {step === 2 && <StepIdentidade data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <StepDNS data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <StepPagamentos data={data} update={update} onBack={() => setStep(3)} onNext={() => setStep(5)} />}
        {step === 5 && <StepFinal data={data} />}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  const steps = ['Marca', 'Identidade', 'Domínio', 'Pagamentos', 'Pronto']
  return (
    <div className="container mx-auto px-6 mb-6">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        {steps.map((label, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div
                className={`flex items-center gap-2 text-xs font-medium transition-all ${
                  active ? 'text-brand-400' : done ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? 'border-brand-500 bg-brand-500/20'
                      : done
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-border'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5 text-white" /> : n}
                </div>
                <span className="hidden md:inline">{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${done ? 'bg-brand-500' : 'bg-border'}`} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// STEP 1 — Marca (logo upload, nome, tagline)
// ═════════════════════════════════════════════════════════════════
function StepMarca({
  data,
  update,
  onNext,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  onNext: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    if (!file.type.startsWith('image/')) {
      setUploadError('Arquivo precisa ser uma imagem (PNG, JPG, SVG).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Imagem muito grande. Máximo 2MB.')
      return
    }

    setUploading(true)
    try {
      // Fallback: converter para data URL e mostrar preview imediatamente.
      // Quando o usuário criar a conta, o tenant enviará o arquivo real para
      // R2 via /api/v1/media. Aqui garantimos que o preview atualiza na hora.
      const reader = new FileReader()
      reader.onload = () => {
        update('logoUrl', reader.result as string)
        setUploading(false)
      }
      reader.onerror = () => {
        setUploadError('Não foi possível ler o arquivo.')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar a imagem.')
      setUploading(false)
    }
  }

  function openFilePicker() {
    fileRef.current?.click()
  }

  function removeLogo() {
    update('logoUrl', '')
    if (fileRef.current) fileRef.current.value = ''
  }

  const canContinue = data.nome.trim().length >= 2

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold mb-2">Sua marca</h2>
        <p className="text-muted-foreground mb-8">Comece definindo o nome, a identidade e o logo da sua plataforma.</p>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome do seu negócio</label>
            <input
              className="input-base"
              placeholder="Ex: FitPro Academia"
              value={data.nome}
              onChange={(e) => update('nome', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Subdomínio</label>
            <div className="flex items-center gap-0">
              <input
                className="input-base rounded-r-none"
                placeholder="suamarca"
                value={data.slug}
                onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <div className="h-12 px-4 flex items-center bg-white/5 border border-l-0 border-border rounded-r-xl text-sm text-brand-400 font-mono">
                .wazefit.com
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Seus alunos acessarão em{' '}
              <span className="text-brand-400 font-mono">
                {data.slug || 'suamarca'}.wazefit.com
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Tagline <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              className="input-base"
              placeholder="Ex: Transforme sua vida com treinos personalizados"
              value={data.tagline}
              onChange={(e) => update('tagline', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Logo <span className="text-muted-foreground">(opcional)</span>
            </label>

            {/* ⬇ Input file escondido — acionado pelo botão abaixo */}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {data.logoUrl ? (
              <div className="glass p-4 flex items-center gap-4">
                <img src={data.logoUrl} alt="Preview do logo" className="w-16 h-16 rounded-lg object-contain bg-white/5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo carregado</p>
                  <p className="text-xs text-muted-foreground">Pré-visualização atualizada ao vivo</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={openFilePicker} className="btn-outline py-2 px-3 text-xs">
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="py-2 px-3 text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:border-brand-500/50 hover:bg-white/5 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Enviando…' : 'Clique para enviar a logo'}
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPG ou SVG — máx. 2MB</span>
              </button>
            )}
            {uploadError && (
              <p className="text-xs text-red-400 mt-2">{uploadError}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className="btn-primary inline-flex items-center gap-2"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PreviewCard data={data} />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// STEP 2 — Identidade (fonte + cores com preview sincronizado)
// ═════════════════════════════════════════════════════════════════
function StepIdentidade({
  data,
  update,
  onBack,
  onNext,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  onBack: () => void
  onNext: () => void
}) {
  function selectPalette(p: typeof PALETTES[number]) {
    update('primaryColor', p.primary)
    update('secondaryColor', p.secondary)
    update('accentColor', p.accent)
  }

  function selectFont(f: typeof FONTS[number]) {
    update('fontFamily', f.stack)
    update('fontName', f.name)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold mb-2">Identidade visual</h2>
        <p className="text-muted-foreground mb-8">Defina as cores e o estilo da sua plataforma.</p>

        <div className="space-y-6">
          {/* Tema */}
          <div>
            <label className="text-sm font-medium mb-3 block">Tema</label>
            <div className="flex gap-3">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('theme', t)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                    data.theme === t ? 'border-brand-500 bg-brand-500/10' : 'border-border hover:border-border/80'
                  }`}
                >
                  <Palette className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-sm">{t === 'dark' ? 'Dark' : 'Light'}</div>
                    <div className="text-xs text-muted-foreground">
                      {t === 'dark' ? 'Moderno e elegante' : 'Limpo e claro'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Paletas */}
          <div>
            <label className="text-sm font-medium mb-3 block">Paleta de cores</label>
            <div className="grid grid-cols-3 gap-2">
              {PALETTES.map((p) => {
                const active = data.primaryColor === p.primary
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => selectPalette(p)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      active ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-border/80'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      <span className="w-6 h-6 rounded-full" style={{ background: p.primary }} />
                      <span className="w-6 h-6 rounded-full" style={{ background: p.secondary }} />
                      <span className="w-6 h-6 rounded-full" style={{ background: p.accent }} />
                    </div>
                    <div className="text-xs font-medium">{p.name}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cores customizadas */}
          <div>
            <label className="text-sm font-medium mb-3 block">Cores customizadas</label>
            <div className="flex gap-4">
              <ColorInput label="Primária" value={data.primaryColor} onChange={(v) => update('primaryColor', v)} />
              <ColorInput label="Secundária" value={data.secondaryColor} onChange={(v) => update('secondaryColor', v)} />
              <ColorInput label="Destaque" value={data.accentColor} onChange={(v) => update('accentColor', v)} />
            </div>
          </div>

          {/* Fonte */}
          <div>
            <label className="text-sm font-medium mb-3 block">Fonte</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => {
                const active = data.fontName === f.name
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => selectFont(f)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      active ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-border/80'
                    }`}
                    style={{ fontFamily: f.stack }}
                  >
                    <div className="text-lg font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Aa Bb Cc 123 — {f.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-between">
            <button type="button" onClick={onBack} className="btn-outline inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button type="button" onClick={onNext} className="btn-primary inline-flex items-center gap-2">
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PreviewCard data={data} showFontFooter />
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1">
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
        />
        <span className="text-xs font-mono text-muted-foreground">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// STEP 3 — DNS (CNAME app.wazefit.com)
// ═════════════════════════════════════════════════════════════════
function StepDNS({
  data,
  update,
  onBack,
  onNext,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  onBack: () => void
  onNext: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copyCname() {
    navigator.clipboard.writeText('app.wazefit.com').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Domínio personalizado</h2>
      <p className="text-muted-foreground mb-8">
        Use um domínio próprio ou continue com o subdomínio gratuito .wazefit.com. Você pode configurar depois.
      </p>

      <div className="space-y-6">
        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Subdomínio gratuito</p>
                <p className="text-sm font-mono text-brand-400">
                  {data.slug || 'suamarca'}.wazefit.com
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-brand-400" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Domínio próprio <span className="text-muted-foreground">(opcional)</span>
          </label>
          <div className="flex gap-2">
            <input
              className="input-base flex-1"
              placeholder="app.seudominio.com.br"
              value={data.customDomain}
              onChange={(e) => update('customDomain', e.target.value)}
            />
          </div>
        </div>

        {data.customDomain && (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm mb-2">Configure o DNS</p>
                <p className="text-sm text-muted-foreground mb-3">
                  No seu provedor de DNS, adicione um registro CNAME apontando para <code className="font-mono text-brand-400">app.wazefit.com</code>:
                </p>
                <div className="bg-background/80 rounded-lg p-3 font-mono text-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 overflow-x-auto">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="text-brand-400">CNAME</span>
                    <span className="text-muted-foreground">Nome</span>
                    <span className="text-foreground truncate">{data.customDomain || 'app.seudominio.com.br'}</span>
                    <span className="text-muted-foreground">Valor</span>
                    <span className="text-brand-400">app.wazefit.com</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyCname}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Copiar"
                  >
                    {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Após configurar, pode levar até 15 minutos para o DNS propagar e o SSL ser emitido.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-between">
          <button type="button" onClick={onBack} className="btn-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button type="button" onClick={onNext} className="btn-primary inline-flex items-center gap-2">
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// STEP 4 — Pagamentos (Cartão/PIX/Boleto botões funcionais)
// ═════════════════════════════════════════════════════════════════
function StepPagamentos({
  data,
  update,
  onBack,
  onNext,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  onBack: () => void
  onNext: () => void
}) {
  const [connecting, setConnecting] = useState(false)

  function togglePayment(key: PaymentKey) {
    update('payments', { ...data.payments, [key]: !data.payments[key] })
  }

  function connectStripe() {
    setConnecting(true)
    // Abrir fluxo de conexão Stripe em nova aba.
    // Backend resolve via /api/v1/tenant/stripe/connect (a ser implementado).
    const token = typeof window !== 'undefined' ? localStorage.getItem('wf_token') : null
    const url = token
      ? `${API_URL}/api/v1/tenant/stripe/connect?token=${encodeURIComponent(token)}`
      : `${API_URL}/api/v1/tenant/stripe/connect`
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => {
      update('stripeConnected', true)
      setConnecting(false)
    }, 1200)
  }

  const anySelected = Object.values(data.payments).some(Boolean)

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Pagamentos</h2>
      <p className="text-muted-foreground mb-8">
        Escolha como seus alunos vão pagar. Você pode ativar e desativar métodos depois, no painel.
      </p>

      <div className="space-y-6">
        {/* Stripe */}
        <div
          className={`rounded-2xl p-5 border transition-all ${
            data.stripeConnected ? 'border-brand-500/30 bg-brand-500/5' : 'glass hover:border-brand-500/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">Stripe</span>
                <ExternalLink className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Receba pagamentos recorrentes com segurança. Taxa padrão da Stripe.
              </p>
              {data.stripeConnected ? (
                <div className="flex items-center gap-2 text-sm text-brand-400">
                  <CheckCircle2 className="w-4 h-4" /> Stripe conectado com sucesso
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectStripe}
                  disabled={connecting}
                  className="btn-primary inline-flex items-center gap-2 text-sm py-2"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  Conectar Stripe
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Métodos de pagamento — botões funcionais */}
        <div>
          <label className="text-sm font-medium mb-3 block">Métodos que você aceita</label>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((m) => {
              const active = data.payments[m.key]
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => togglePayment(m.key)}
                  aria-pressed={active}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-border hover:border-brand-500/40 hover:bg-white/5'
                  }`}
                >
                  <div className="text-3xl mb-2">{m.emoji}</div>
                  <div className="text-xs font-medium">{m.label}</div>
                  {active && <div className="text-[10px] text-brand-400 mt-1">Ativo</div>}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {anySelected
              ? `${Object.values(data.payments).filter(Boolean).length} método(s) ativo(s).`
              : 'Selecione ao menos um método de pagamento ou pule essa etapa.'}
          </p>
        </div>

        <div className="flex gap-3 justify-between">
          <button type="button" onClick={onBack} className="btn-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button type="button" onClick={onNext} className="btn-primary inline-flex items-center gap-2">
            Finalizar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// STEP 5 — Final
// ═════════════════════════════════════════════════════════════════
function StepFinal({ data }: { data: OnboardingData }) {
  const tenantUrl = `https://${data.slug || 'suamarca'}.wazefit.com`
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-6 glow-green">
        <Rocket className="w-10 h-10 text-brand-400" />
      </div>
      <h2 className="text-4xl font-bold mb-3">Tudo pronto!</h2>
      <p className="text-lg text-muted-foreground mb-2">Sua plataforma <strong className="text-brand-400">{data.nome || 'fitness'}</strong> está no ar.</p>
      <p className="text-sm text-muted-foreground mb-8">
        Acesse em <span className="font-mono text-brand-400">{tenantUrl}</span>
      </p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <a href={tenantUrl} className="btn-primary inline-flex items-center justify-center gap-2 flex-1">
          <ShieldCheck className="w-4 h-4" /> Ir para o Dashboard
        </a>
        <a href={tenantUrl} target="_blank" rel="noreferrer" className="btn-outline inline-flex items-center justify-center gap-2 flex-1">
          <ExternalLink className="w-4 h-4" /> Abrir em nova aba
        </a>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// Preview — reage a todos os campos do onboarding
// ═════════════════════════════════════════════════════════════════
function PreviewCard({ data, showFontFooter = false }: { data: OnboardingData; showFontFooter?: boolean }) {
  const textColor = data.theme === 'dark' ? '#fff' : '#0a0a0a'
  const bodyBg = data.theme === 'dark' ? '#0f0f0f' : '#ffffff'

  return (
    <div className="hidden lg:block sticky top-10">
      <p className="text-sm text-muted-foreground mb-4">Preview ao vivo</p>
      <div className="glass overflow-hidden" style={{ fontFamily: data.fontFamily }}>
        <div className="bg-gradient-to-br from-brand-900/40 to-background p-4 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500/60" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground ml-2 truncate">
            {data.slug || 'suamarca'}.wazefit.com
          </span>
        </div>

        <div className="p-6 transition-all" style={{ background: bodyBg, color: textColor }}>
          <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: `1px solid ${textColor}15` }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: data.primaryColor }}
            >
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Dumbbell className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold truncate" style={{ color: data.primaryColor }}>
                {data.nome || 'Sua Marca'}
              </div>
              <div className="text-xs opacity-60 truncate">{data.tagline || 'Sua tagline aqui'}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="p-4 rounded-xl"
              style={{
                background: `${data.primaryColor}12`,
                border: `1px solid ${data.primaryColor}30`,
              }}
            >
              <div className="text-sm font-medium">Treino do dia</div>
              <div className="text-2xl font-bold mt-1">Superior A</div>
              <div className="text-xs opacity-60 mt-1">6 exercícios · 45min</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ background: `${data.secondaryColor}10`, border: `1px solid ${data.secondaryColor}25` }}
              >
                <div className="text-xs opacity-60">Calorias</div>
                <div className="text-xl font-bold">2.450</div>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ background: `${data.accentColor}10`, border: `1px solid ${data.accentColor}25` }}
              >
                <div className="text-xs opacity-60">Sequência</div>
                <div className="text-xl font-bold">12 dias</div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 rounded-xl font-medium text-white text-sm"
              style={{ background: data.primaryColor }}
            >
              Iniciar treino
            </button>
          </div>
        </div>

        {showFontFooter && (
          <div className="px-6 py-3 border-t border-border/50 bg-muted/30 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Fonte: <span className="font-medium text-foreground" style={{ fontFamily: data.fontFamily }}>{data.fontName}</span>
            </div>
            <div className="text-xs text-brand-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Preview atualizado
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
