import Link from 'next/link'
import { ArrowRight, Dumbbell, Rocket, ShieldCheck, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brand-900/20">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-brand-400" />
          </div>
          <span className="font-bold text-lg">WazeFit</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-all">
            Entrar
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            Criar conta
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-20 max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-sm text-brand-400 mb-6">
          <Sparkles className="w-4 h-4" />
          Plataforma white label fitness
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Sua plataforma fitness,
          <br />
          <span className="text-brand-400">pronta em minutos.</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Crie sua marca fitness com domínio próprio, treinos, dieta, pagamentos e comunidade. Tudo pronto, white label,
          com sua identidade.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 justify-center">
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-outline inline-flex items-center gap-2 justify-center">
            Já tenho conta
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-20">
          <Feature icon={<Rocket className="w-5 h-5 text-brand-400" />} title="Pronto em 5 minutos" desc="Cadastro, identidade visual e domínio próprio configurados em minutos." />
          <Feature icon={<ShieldCheck className="w-5 h-5 text-brand-400" />} title="100% white label" desc="Sua marca, suas cores, seu domínio. Seus alunos nunca verão o WazeFit." />
          <Feature icon={<Dumbbell className="w-5 h-5 text-brand-400" />} title="Tudo que precisa" desc="Treinos, dieta, avaliações, chat, pagamentos, comunidade e IA." />
        </div>
      </main>

      <footer className="container mx-auto px-6 py-10 text-center text-sm text-muted-foreground border-t border-border mt-20">
        © {new Date().getFullYear()} WazeFit. Todos os direitos reservados.
      </footer>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass p-6 text-left">
      <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
