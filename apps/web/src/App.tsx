/**
 * App — roteamento completo Sprint 2.
 * Expert: sidebar layout. Aluno: bottom-nav layout.
 */
import { useState, useEffect } from 'react'
import { checkSession, logout as doLogout } from './stores/auth'
import type { User, Tenant } from './stores/auth'
import { ToastProvider } from './components/ui/Toast'

// Auth
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Layouts
import { ExpertLayout } from './components/ui/ExpertLayout'
import { AlunoLayout } from './components/ui/AlunoLayout'

// Expert pages
import { DashboardPage } from './pages/expert/DashboardPage'
import { ExerciciosPage } from './pages/expert/ExerciciosPage'
import { FichasPage } from './pages/expert/FichasPage'
import { BibliotecaPage } from './pages/expert/BibliotecaPage'
import { AlunoDetalhePage } from './pages/expert/AlunoDetalhePage'
import { ChatPage } from './pages/expert/ChatPage'
import { FinanceiroPage } from './pages/expert/FinanceiroPage'
import { RankingPage } from './pages/expert/RankingPage'
import { BriefingPage } from './pages/expert/BriefingPage'
import { GerarIAPage } from './pages/expert/GerarIAPage'
import { NutricaoPage } from './pages/expert/NutricaoPage'
import { AvaliacoesPage } from './pages/expert/AvaliacoesPage'
import { ConfigPage } from './pages/expert/ConfigPage'
import AnalyticsPage from './pages/expert/AnalyticsPage'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

// Aluno pages
import { TreinoDiaPage } from './pages/aluno/TreinoDiaPage'
import { MeuRankingPage } from './pages/aluno/MeuRankingPage'
import { ChatAlunoPage } from './pages/aluno/ChatAlunoPage'
import { PerfilPage } from './pages/aluno/PerfilPage'
import { NutricaoAlunoPage } from './pages/aluno/NutricaoAlunoPage'

type Page = 'loading' | 'landing' | 'login' | 'register' | 'app'

function AppInner() {
  const [page, setPage] = useState<Page>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [appPath, setAppPath] = useState('/dashboard')

  // ── Inicialização ──
  useEffect(() => {
    async function init() {
      const session = await checkSession()
      if (session) {
        setUser(session.user)
        setTenant(session.tenant)
        const path = window.location.pathname
        // Rota válida? Manter. Senão, default por role.
        if (path.startsWith('/expert/') || path.startsWith('/aluno/') || path === '/dashboard' || path.startsWith('/alunos')) {
          setAppPath(path)
        } else {
          setAppPath(session.user.role === 'aluno' ? '/aluno/treino' : '/dashboard')
        }
        setPage('app')
      } else {
        const path = window.location.pathname
        if (path === '/login') setPage('login')
        else if (path === '/register') setPage('register')
        else if (path === '/' || path === '') setPage('landing')
        else {
          window.history.replaceState(null, '', '/login')
          setPage('login')
        }
      }
    }
    init()
  }, [])

  // ── Auth callbacks ──
  function onAuthSuccess(u: User, t: Tenant) {
    setUser(u)
    setTenant(t)
    const defaultPath = u.role === 'aluno' ? '/aluno/treino' : '/dashboard'
    setAppPath(defaultPath)
    setPage('app')
    window.history.pushState(null, '', defaultPath)
  }

  function navigate(path: string) {
    window.history.pushState(null, '', path)
    if (path === '/login') { setPage('login'); return }
    if (path === '/register') { setPage('register'); return }
    if (path === '/') { setPage('landing'); return }
    if (user && tenant) {
      setAppPath(path)
      setPage('app')
    } else {
      setPage('login')
    }
  }

  async function handleLogout() {
    await doLogout()
    setUser(null)
    setTenant(null)
    setPage('login')
    window.history.pushState(null, '', '/login')
  }

  // ── Back/forward ──
  useEffect(() => {
    function onPopState() {
      const path = window.location.pathname
      if (path === '/login') setPage('login')
      else if (path === '/register') setPage('register')
      else if (path === '/') setPage(user ? 'app' : 'landing')
      else if (user) { setAppPath(path); setPage('app') }
      else setPage('login')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [user])

  // ── Render ──
  if (page === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (page === 'login') return <LoginPage onSuccess={onAuthSuccess} onNavigate={navigate} />
  if (page === 'register') return <RegisterPage onSuccess={onAuthSuccess} onNavigate={navigate} />

  if (page === 'app' && user && tenant) {
    const isAluno = user.role === 'aluno'

    // ── Aluno App ──
    if (isAluno) {
      return (
        <AlunoLayout user={user} tenant={tenant} currentPath={appPath} onNavigate={navigate} onLogout={handleLogout}>
          {appPath === '/aluno/treino' && <TreinoDiaPage />}
          {appPath === '/aluno/ranking' && <MeuRankingPage />}
          {appPath === '/aluno/chat' && <ChatAlunoPage />}
          {appPath === '/aluno/nutricao' && <NutricaoAlunoPage />}
          {appPath === '/aluno/perfil' && <PerfilPage />}
        </AlunoLayout>
      )
    }

    // ── Expert App ──
    const chatAlunoMatch = appPath.match(/^\/expert\/chat\/(.+)$/)
    const alunoDetalheMatch = appPath.match(/^\/expert\/alunos\/(.+)$/) ?? appPath.match(/^\/alunos\/(.+)$/)

    return (
      <ExpertLayout user={user} tenant={tenant} currentPath={appPath} onNavigate={navigate} onLogout={handleLogout}>
        {appPath === '/dashboard' && <DashboardPage user={user} tenant={tenant} />}
        {(appPath === '/alunos') && <Placeholder title="Alunos" icon="👥" />}
        {alunoDetalheMatch && <AlunoDetalhePage alunoId={alunoDetalheMatch[1]!} />}
        {appPath === '/expert/exercicios' && <ExerciciosPage />}
        {appPath === '/expert/fichas' && <FichasPage />}
        {appPath === '/expert/biblioteca' && <BibliotecaPage />}
        {appPath === '/expert/chat' && !chatAlunoMatch && <ChatPage onNavigate={navigate} />}
        {chatAlunoMatch && <ChatPage alunoId={chatAlunoMatch[1]} onNavigate={navigate} />}
        {appPath === '/expert/financeiro' && <FinanceiroPage />}
        {appPath === '/expert/ranking' && <RankingPage />}
        {appPath === '/expert/briefings' && <BriefingPage />}
        {appPath === '/expert/gerar-ia' && <GerarIAPage />}
        {appPath === '/expert/nutricao' && <NutricaoPage />}
        {appPath === '/expert/avaliacoes' && <AvaliacoesPage />}
        {appPath === '/expert/analytics' && <AnalyticsPage />}
        {appPath === '/expert/config' && <ConfigPage />}
        {appPath === '/admin/dashboard' && user.role === 'admin' && <AdminDashboardPage />}
      </ExpertLayout>
    )
  }

  // Landing
  return <Landing onNavigate={navigate} />
}

export function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

// ── Placeholder (para Alunos lista — Sprint 1) ──
function Placeholder({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="text-6xl mb-4">{icon}</span>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-400">Em desenvolvimento</p>
    </div>
  )
}

// ── Landing ──
function Landing({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-sm">W</div>
            <span className="text-xl font-bold">Waze<span className="text-green-400">Fit</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('/login')} className="text-sm text-gray-400 hover:text-white transition-colors">Entrar</button>
            <button onClick={() => onNavigate('/register')} className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">Criar conta</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Plataforma fitness completa</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Sua plataforma fitness{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">completa</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gerencie alunos, crie treinos personalizados, acompanhe evolução e escale seu negócio fitness. Tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('/register')} className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25">Começar grátis</button>
            <button onClick={() => onNavigate('/login')} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all">Já tenho conta</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {[{ icon: '🏋️', label: 'Treinos' }, { icon: '📊', label: 'Evolução' }, { icon: '👥', label: 'Alunos' }, { icon: '💰', label: 'Financeiro' }].map(f => (
              <div key={f.label} className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-colors">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm text-gray-400">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} WazeFit. Todos os direitos reservados.
      </footer>
    </div>
  )
}
