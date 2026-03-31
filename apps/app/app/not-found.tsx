export const runtime = 'edge';

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-6">Página não encontrada</p>
        <Link href="/" className="text-primary hover:underline">
          Voltar para home
        </Link>
      </div>
    </div>
  );
}
