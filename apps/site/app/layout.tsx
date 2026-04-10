import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WazeFit — Plataforma white label fitness',
  description: 'Crie sua plataforma fitness em minutos. White label, treinos, pagamentos e dieta.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
