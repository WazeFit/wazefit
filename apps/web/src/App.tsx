/**
 * App — Router principal com navegação SPA.
 */
import { useEffect, useState } from 'react'
import { useAuth } from './stores/auth'
import { useRouter } from './hooks/useRouter'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/expert/DashboardPage'
import { ExpertLayout } from './components/ui/ExpertLayout'

function Router() {
  const { isAuthenticated, isLoading, user, loadUser } = useAuth()
  const { path, navigate } = useRouter()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadUser().finally(() => setInitialized(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Enquanto não inicializou, mostrar spinner
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  // ── Rotas públicas (sempre acessíveis) ──
  if (path === '/login') {
    if (isAuthenticated && user) {
      navigate('/dashboard')
      return null
    }
    return <LoginPage onNavigate={navigate} />
  }

  if (path === '/register') {
    if (isAuthenticated && user) {
      navigate('/dashboard')
      return null
    }
    return <RegisterPage onNavigate={navigate} />
  }

  // ── Landing (não autenticado na raiz) ──
  if (!isAuthenticated || !user) {
    if (path === '/') return <LandingPage onNavigate={navigate} />
    navigate('/login')
    return null
  }

  // ── Redirect raiz → dashboard ──
  if (path === '/') {
    navigate('/dashboard')
    return null
  }

  // ── Rotas protegidas ──
  return (
    <ExpertLayout onNavigate={navigate}>
      {path === '/dashboard' && <DashboardPage />}
      {path.startsWith('/alunos') && <PlaceholderPage title="Alunos" icon="👥" />}
      {path.startsWith('/exercicios') && <PlaceholderPage title="Exercícios" icon="🏋️" />}
      {path.startsWith('/fichas') && <PlaceholderPage title="Fichas" icon="📋" />}
      {path.startsWith('/chat') && <PlaceholderPage title="Chat" icon="💬" />}
      {path.startsWith('/financeiro') && <PlaceholderPage title="Financeiro" icon="💰" />}
    </ExpertLayout>
  )
}

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="text-6xl mb-4">{icon}</span>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-400">Em desenvolvimento — Sprint 2</p>
    </div>
  )
}

function LandingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-sm">
              W
            </div>
            <span className="text-xl font-bold">
              Waze<span className="text-brand-400">Fit</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => onNavigate('/register')}
              className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Criar conta
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            <span className="text-brand-400 text-sm font-medium">Plataforma em desenvolvimento</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Sua plataforma fitness{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300">
              completa
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gerencie alunos, crie treinos personalizados, acompanhe evolução e escale seu negócio
            fitness. Tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('/register')}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/25"
            >
              Começar grátis
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
            >
              Já tenho conta
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {[
              { icon: '🏋️', label: 'Treinos' },
              { icon: '📊', label: 'Evolução' },
              { icon: '👥', label: 'Alunos' },
              { icon: '💰', label: 'Financeiro' },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 hover:border-brand-500/30 transition-colors"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm text-gray-400">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} WazeFit. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

export function App() {
  return <Router />
}
