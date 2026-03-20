import { useState } from 'react'

export function App() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
          <span className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
            Em breve
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            <span className="text-brand-400 text-sm font-medium">
              Plataforma em desenvolvimento
            </span>
          </div>

          {/* Headline */}
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

          {/* CTA */}
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/25 animate-pulse-glow"
              >
                Quero acesso antecipado
              </button>
            </form>
          ) : (
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-6 py-4 max-w-md mx-auto">
              <p className="text-brand-400 font-medium">🎉 Massa! Você está na lista.</p>
              <p className="text-gray-400 text-sm mt-1">Vamos te avisar quando lançarmos.</p>
            </div>
          )}

          {/* Features preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {[
              { icon: '🏋️', label: 'Treinos' },
              { icon: '📊', label: 'Evolução' },
              { icon: '👥', label: 'Alunos' },
              { icon: '💰', label: 'Financeiro' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 hover:border-brand-500/30 transition-colors"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-sm text-gray-400">{feature.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} WazeFit. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
