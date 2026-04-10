import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">404</p>
        <h1 className="text-3xl font-bold mb-4">Página não encontrada</h1>
        <Link href="/" className="text-brand-400 hover:text-brand-500">
          ← Voltar para o início
        </Link>
      </div>
    </div>
  )
}
