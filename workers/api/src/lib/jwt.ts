/**
 * JWT utilities para Cloudflare Workers.
 * Usa Web Crypto API (HMAC-SHA256) — zero dependências externas.
 */

export interface JWTPayload {
  sub: string // user_id
  tid: string // tenant_id
  role: 'expert' | 'aluno' | 'admin'
  email: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

const ACCESS_TOKEN_TTL = 15 * 60 // 15 minutos
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 // 7 dias

/**
 * Gera par de tokens (access + refresh).
 */
export async function generateTokens(
  secret: string,
  payload: Pick<JWTPayload, 'sub' | 'tid' | 'role' | 'email'>,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const now = Math.floor(Date.now() / 1000)

  const accessToken = await signJWT(secret, {
    ...payload,
    type: 'access',
    iat: now,
    exp: now + ACCESS_TOKEN_TTL,
  })

  const refreshToken = await signJWT(secret, {
    ...payload,
    type: 'refresh',
    iat: now,
    exp: now + REFRESH_TOKEN_TTL,
  })

  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL }
}

/**
 * Assina JWT com HMAC-SHA256.
 */
async function signJWT(secret: string, payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }

  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const message = `${encodedHeader}.${encodedPayload}`

  const key = await getSigningKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const encodedSignature = base64urlEncode(signature)

  return `${message}.${encodedSignature}`
}

/**
 * Verifica e decodifica JWT.
 * Retorna payload se válido, null se inválido/expirado.
 */
export async function verifyJWT(secret: string, token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const message = `${encodedHeader}.${encodedPayload}`

    // Verificar assinatura
    const key = await getSigningKey(secret)
    const signature = base64urlDecode(encodedSignature)
    const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(message))
    if (!valid) return null

    // Decodificar payload
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload))) as JWTPayload

    // Verificar expiração
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}

/**
 * Decodifica payload JWT SEM verificar assinatura.
 * Usar apenas para ler claims antes de verificação (ex: extrair tipo).
 */
export function decodeJWTUnsafe(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1]))) as JWTPayload
  } catch {
    return null
  }
}

// ── Helpers ──

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function base64urlEncode(input: string | ArrayBuffer): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(input: string): ArrayBuffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (padded.length % 4)) % 4)
  const binary = atob(padded + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
