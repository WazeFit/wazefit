/**
 * WazeFit LLM Worker — Queue consumer para processamento de IA.
 * Consome jobs da fila QUEUE_LLM, chama Anthropic API (Claude),
 * salva resultado em llm_jobs.
 *
 * Tipos suportados: briefing, treino, dieta
 */

interface Env {
  DB: D1Database
  ANTHROPIC_API_KEY: string
  ENVIRONMENT: string
}

interface QueueMessage {
  job_id: string
  tipo: 'briefing' | 'treino' | 'dieta' | 'avaliacao'
  tenant_id: string
}

interface AnthropicResponse {
  id: string
  content: Array<{ type: string; text: string }>
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// Custo estimado por 1M tokens (Claude 3.5 Sonnet em centavos USD)
const COST_INPUT_PER_M = 300   // $3.00 per 1M input tokens
const COST_OUTPUT_PER_M = 1500 // $15.00 per 1M output tokens

function estimateCostCentavos(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * COST_INPUT_PER_M
  const outputCost = (outputTokens / 1_000_000) * COST_OUTPUT_PER_M
  return Math.ceil(inputCost + outputCost)
}

function nowISO(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  retries = 3,
): Promise<AnthropicResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        // Retry on 429 (rate limit) and 5xx
        if (response.status === 429 || response.status >= 500) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          lastError = new Error(`Anthropic API error ${response.status}: ${errorText}`)
          continue
        }
        throw new Error(`Anthropic API error ${response.status}: ${errorText}`)
      }

      return (await response.json()) as AnthropicResponse
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new Error('Falha ao chamar Anthropic API')
}

function buildBriefingPrompt(input: Record<string, unknown>): { system: string; user: string } {
  const aluno = input['aluno'] as Record<string, unknown> | undefined
  return {
    system: `Você é um personal trainer e nutricionista experiente. Gere perguntas de anamnese personalizadas para conhecer melhor o aluno e criar um programa de treino e nutrição adequado. Responda APENAS com um JSON array de objetos com campos "pergunta" (string) e "ordem" (number). Gere entre 8 e 15 perguntas cobrindo: histórico de treino, lesões, alimentação, rotina, objetivos, limitações, preferências. Seja específico e profissional.`,
    user: `Dados do aluno:\n${JSON.stringify(aluno, null, 2)}\n\nGere as perguntas de anamnese em formato JSON array.`,
  }
}

function buildTreinoPrompt(input: Record<string, unknown>): { system: string; user: string } {
  const aluno = input['aluno'] as Record<string, unknown> | undefined
  const briefing = input['briefing'] as Record<string, unknown> | undefined
  const parametros = input['parametros'] as Record<string, unknown> | undefined

  return {
    system: `Você é um personal trainer certificado. Crie uma ficha de treino personalizada baseada no perfil do aluno e suas respostas ao briefing. Responda APENAS com um JSON object contendo: "nome" (string), "tipo" (A/B/C), "objetivo" (string), "exercicios" (array de objetos com: "nome", "grupo_muscular", "series", "repeticoes", "carga_sugerida", "descanso_seg", "observacao"). Seja específico com cargas, séries e repetições.`,
    user: `Dados do aluno:\n${JSON.stringify(aluno, null, 2)}\n\nBriefing:\n${JSON.stringify(briefing, null, 2)}\n\nParâmetros:\n${JSON.stringify(parametros, null, 2)}\n\nCrie a ficha de treino em formato JSON.`,
  }
}

function buildDietaPrompt(input: Record<string, unknown>): { system: string; user: string } {
  const aluno = input['aluno'] as Record<string, unknown> | undefined
  const briefing = input['briefing'] as Record<string, unknown> | undefined
  const parametros = input['parametros'] as Record<string, unknown> | undefined

  return {
    system: `Você é um nutricionista esportivo certificado. Crie um plano nutricional personalizado baseado no perfil do aluno. Responda APENAS com um JSON object contendo: "nome" (string), "objetivo" (string), "calorias_diarias" (number), "proteina_g" (number), "carboidrato_g" (number), "gordura_g" (number), "observacoes" (string), "refeicoes" (array de objetos com: "nome", "horario", "ordem", "alimentos" (array com: "nome", "quantidade", "unidade", "calorias", "proteina_g", "carboidrato_g", "gordura_g")). Seja específico com quantidades e horários.`,
    user: `Dados do aluno:\n${JSON.stringify(aluno, null, 2)}\n\nBriefing:\n${JSON.stringify(briefing, null, 2)}\n\nParâmetros:\n${JSON.stringify(parametros, null, 2)}\n\nCrie o plano nutricional em formato JSON.`,
  }
}

async function processJob(env: Env, jobId: string): Promise<void> {
  const timestamp = nowISO()

  // Marcar como processing
  await env.DB.prepare(
    'UPDATE llm_jobs SET status = ? WHERE id = ?',
  ).bind('processing', jobId).run()

  // Buscar job
  const job = await env.DB.prepare(
    'SELECT * FROM llm_jobs WHERE id = ?',
  ).bind(jobId).first<{
    id: string
    tenant_id: string
    tipo: string
    input_json: string
    status: string
  }>()

  if (!job) {
    console.error(`Job ${jobId} não encontrado`)
    return
  }

  const input = JSON.parse(job.input_json) as Record<string, unknown>

  let prompts: { system: string; user: string }

  switch (job.tipo) {
    case 'briefing':
      prompts = buildBriefingPrompt(input)
      break
    case 'treino':
      prompts = buildTreinoPrompt(input)
      break
    case 'dieta':
      prompts = buildDietaPrompt(input)
      break
    default:
      await env.DB.prepare(
        'UPDATE llm_jobs SET status = ?, erro = ?, completado_em = ? WHERE id = ?',
      ).bind('failed', `Tipo não suportado: ${job.tipo}`, timestamp, jobId).run()
      return
  }

  try {
    const response = await callAnthropic(env.ANTHROPIC_API_KEY, prompts.system, prompts.user)

    const outputText = response.content[0]?.text ?? ''
    const tokensInput = response.usage.input_tokens
    const tokensOutput = response.usage.output_tokens
    const custoCentavos = estimateCostCentavos(tokensInput, tokensOutput)
    const completedAt = nowISO()

    // Salvar resultado
    await env.DB.prepare(
      'UPDATE llm_jobs SET status = ?, output_json = ?, tokens_input = ?, tokens_output = ?, custo_centavos = ?, completado_em = ? WHERE id = ?',
    ).bind('completed', outputText, tokensInput, tokensOutput, custoCentavos, completedAt, jobId).run()

    // Se for briefing, salvar perguntas na tabela briefing_perguntas
    if (job.tipo === 'briefing') {
      await saveBriefingPerguntas(env, input, outputText, job.tenant_id)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    await env.DB.prepare(
      'UPDATE llm_jobs SET status = ?, erro = ?, completado_em = ? WHERE id = ?',
    ).bind('failed', errorMsg, nowISO(), jobId).run()

    // Se for briefing, reverter status
    if (job.tipo === 'briefing') {
      const briefingId = (input as Record<string, unknown>)['briefing_id'] as string | undefined
      if (briefingId) {
        await env.DB.prepare(
          'UPDATE briefings SET status = ?, atualizado_em = ? WHERE id = ?',
        ).bind('pendente', nowISO(), briefingId).run()
      }
    }
  }
}

async function saveBriefingPerguntas(
  env: Env,
  input: Record<string, unknown>,
  outputText: string,
  tenantId: string,
): Promise<void> {
  const briefingId = input['briefing_id'] as string | undefined
  if (!briefingId) return

  try {
    // Extrair JSON do output (pode ter markdown wrapping)
    let jsonStr = outputText.trim()
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const perguntas = JSON.parse(jsonStr) as Array<{ pergunta: string; ordem: number }>

    for (const p of perguntas) {
      const id = crypto.randomUUID()
      await env.DB.prepare(
        'INSERT INTO briefing_perguntas (id, briefing_id, tenant_id, pergunta, ordem, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(id, briefingId, tenantId, p.pergunta, p.ordem, nowISO()).run()
    }

    // Atualizar status do briefing
    await env.DB.prepare(
      'UPDATE briefings SET status = ?, atualizado_em = ? WHERE id = ?',
    ).bind('em_andamento', nowISO(), briefingId).run()
  } catch (error) {
    console.error('Erro ao salvar perguntas do briefing:', error)
    // Não falhar o job por causa disso — o output já foi salvo
  }
}

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { job_id } = message.body
      try {
        await processJob(env, job_id)
        message.ack()
      } catch (error) {
        console.error(`Erro ao processar job ${job_id}:`, error)
        message.retry()
      }
    }
  },
}
