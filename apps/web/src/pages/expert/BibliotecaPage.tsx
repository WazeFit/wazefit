import { useState, useEffect } from 'react'
import { api, type Template, ApiError } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

export function BibliotecaPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setTemplates(await api.biblioteca.list())
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar biblioteca')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Biblioteca de Templates</h1>
        <p className="text-gray-400 text-sm">Templates prontos para usar nas fichas</p>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon="📚" title="Nenhum template" description="Templates de fichas aparecerão aqui." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white">{tmpl.nome}</h3>
                <Badge variant="success">{tmpl.tipo}</Badge>
              </div>
              {tmpl.descricao && <p className="text-sm text-gray-400 mb-3">{tmpl.descricao}</p>}
              <div className="space-y-1">
                {tmpl.exercicios.map((ex) => (
                  <div key={ex.exercicio_id} className="flex items-center justify-between text-xs text-gray-500">
                    <span>{ex.ordem}. {ex.exercicio?.nome ?? ex.exercicio_id}</span>
                    <span>{ex.series}x{ex.repeticoes}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
