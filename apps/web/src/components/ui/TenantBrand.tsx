/**
 * TenantBrand — Componente reutilizável de marca do tenant.
 * 
 * Mostra logo + nome do tenant quando disponível,
 * fallback para WazeFit quando não está em contexto de tenant.
 */
import { useTenant, type TenantBranding } from '../../contexts/TenantContext'

interface Props {
  /** Tamanho do ícone/logo */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar nome ao lado? */
  showName?: boolean
  /** Classe extra no container */
  className?: string
}

const SIZES = {
  sm: { icon: 'w-7 h-7', text: 'text-sm', logo: 'h-7' },
  md: { icon: 'w-10 h-10', text: 'text-2xl', logo: 'h-10' },
  lg: { icon: 'w-12 h-12', text: 'text-3xl', logo: 'h-12' },
}

export function TenantBrand({ size = 'md', showName = true, className = '' }: Props) {
  const { branding, isTenantHost } = useTenant()
  const s = SIZES[size]

  if (isTenantHost && branding) {
    return <BrandedLogo branding={branding} sizes={s} showName={showName} className={className} />
  }

  // Default WazeFit
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`${s.icon} bg-brand-500 rounded-xl flex items-center justify-center font-bold text-white shadow-glow-sm`}
        style={{ fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '1.2rem' : '1rem' }}>
        W
      </div>
      {showName && (
        <span className={`${s.text} font-bold text-white`}>
          Waze<span className="text-brand-400">Fit</span>
        </span>
      )}
    </div>
  )
}

function BrandedLogo({
  branding,
  sizes,
  showName,
  className,
}: {
  branding: TenantBranding
  sizes: { icon: string; text: string; logo: string }
  showName: boolean
  className: string
}) {
  const primaryColor = branding.cor_primaria || '#22c55e'

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {branding.logo_url ? (
        <img
          src={branding.logo_url}
          alt={branding.nome}
          className={`${sizes.logo} object-contain rounded-lg`}
        />
      ) : (
        <div
          className={`${sizes.icon} rounded-xl flex items-center justify-center font-bold text-white`}
          style={{ backgroundColor: primaryColor }}
        >
          {branding.nome.charAt(0).toUpperCase()}
        </div>
      )}
      {showName && (
        <span className={`${sizes.text} font-bold text-white`}>
          {branding.nome}
        </span>
      )}
    </div>
  )
}

/**
 * Hook utilitário para pegar a cor primária do tenant (com fallback).
 */
export function useTenantColors() {
  const { branding, isTenantHost } = useTenant()

  if (isTenantHost && branding) {
    return {
      primary: branding.cor_primaria || '#22c55e',
      secondary: branding.cor_secundaria || '#16a34a',
      isBranded: true,
    }
  }

  return {
    primary: '#22c55e',
    secondary: '#16a34a',
    isBranded: false,
  }
}
