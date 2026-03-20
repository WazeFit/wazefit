/**
 * Crypto utilities para Cloudflare Workers.
 * PBKDF2 para hashing de senhas (Web Crypto API nativa).
 */

const ITERATIONS = 100_000
const KEY_LENGTH = 256 // bits
const SALT_LENGTH = 16 // bytes

/**
 * Hash de senha com PBKDF2-SHA256.
 * Retorna formato: `iterations:salt_hex:hash_hex`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH,
  )

  const hashHex = bufToHex(new Uint8Array(derivedBits))
  const saltHex = bufToHex(salt)

  return `${ITERATIONS}:${saltHex}:${hashHex}`
}

/**
 * Verifica senha contra hash armazenado.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterStr, saltHex, expectedHash] = stored.split(':')
  const iterations = parseInt(iterStr, 10)
  const salt = hexToBuf(saltHex)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH,
  )

  const actualHash = bufToHex(new Uint8Array(derivedBits))

  // Comparação timing-safe
  return timingSafeEqual(actualHash, expectedHash)
}

/**
 * Comparação timing-safe para prevenir timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
