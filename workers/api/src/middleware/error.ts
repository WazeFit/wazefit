import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

/**
 * Error handler global — captura e formata todos os erros.
 * Retorna JSON consistente em qualquer cenário.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack)

  // Erro HTTP explícito (throw new HTTPException)
  if (err instanceof HTTPException) {
    return c.json({ error: err.message, code: err.status }, err.status)
  }

  // Erro de validação Zod
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      campo: i.path.join('.'),
      mensagem: i.message,
    }))
    return c.json({ error: 'Dados inválidos.', detalhes: issues, code: 400 }, 400)
  }

  // Erro genérico — nunca expor detalhes internos
  return c.json({ error: 'Erro interno do servidor.', code: 500 }, 500)
}
