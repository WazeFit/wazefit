/**
 * Geração de IDs únicos.
 * Usa crypto.randomUUID() disponível em Cloudflare Workers.
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Gera slug a partir de texto.
 * Remove acentos, lowercase, substitui espaços por hífens.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Timestamp ISO 8601 UTC.
 */
export function now(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}
