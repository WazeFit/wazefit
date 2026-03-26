import { useState } from 'react'
import { Globe, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'

export function DominioPage() {
  const [dominio, setDominio] = useState('')
  const [verificando, setVerificando] = useState(false)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Domínio Personalizado</h1>
        <p className="text-gray-400 mt-2">Configure seu domínio próprio para o app dos alunos</p>
      </div>

      {/* Card principal */}
      <div className="bg-dark-900/50 border border-dark-800/50 rounded-2xl p-8">
        <div className="space-y-6">
          {/* Domínio atual */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Domínio Atual
            </label>
            <div className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
              <Globe className="w-5 h-5 text-gray-500" />
              <code className="text-sm text-gray-400">app.wazefit.com/expert-123</code>
              <a
                href="https://app.wazefit.com/expert-123"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Este é seu domínio padrão. Seus alunos acessam o app por aqui.
            </p>
          </div>

          {/* Domínio personalizado */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Domínio Personalizado
              <span className="text-xs font-normal text-gray-500 ml-2">(opcional)</span>
            </label>
            <input
              type="text"
              value={dominio}
              onChange={(e) => setDominio(e.target.value)}
              placeholder="ex: app.suaacademia.com.br"
              className="w-full input-pro"
            />
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Use seu próprio domínio para fortalecer sua marca. Você precisará configurar um
              registro CNAME no seu provedor de DNS.
            </p>
          </div>

          {/* Botão verificar */}
          <button
            disabled={!dominio || verificando}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verificando ? 'Verificando...' : 'Verificar Domínio'}
          </button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-dark-900/50 border border-dark-800/50 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Como Configurar</h3>
        <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              1
            </div>
            <div>
              <p className="text-white font-medium mb-1">Compre um domínio</p>
              <p>
                Registre um domínio em provedores como Registro.br, GoDaddy, Namecheap, etc.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              2
            </div>
            <div>
              <p className="text-white font-medium mb-1">Configure o DNS</p>
              <p>
                No painel do seu provedor, crie um registro CNAME apontando para{' '}
                <code className="bg-dark-800 px-2 py-0.5 rounded text-gray-300">
                  app.wazefit.com
                </code>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              3
            </div>
            <div>
              <p className="text-white font-medium mb-1">Verifique aqui</p>
              <p>
                Após configurar o DNS (pode levar até 48h), digite seu domínio acima e clique em
                "Verificar Domínio".
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              4
            </div>
            <div>
              <p className="text-white font-medium mb-1">Pronto!</p>
              <p>
                Seus alunos poderão acessar o app pelo seu domínio personalizado. O certificado SSL
                é gerado automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
