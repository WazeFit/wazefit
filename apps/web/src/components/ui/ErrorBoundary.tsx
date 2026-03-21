import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
          <span className="text-5xl mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
          <p className="text-gray-400 mb-4 max-w-md">
            {this.state.error?.message || 'Erro inesperado ao carregar esta página.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
