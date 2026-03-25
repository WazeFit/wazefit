import { sendEmail } from './sendgrid'
import { conviteAluno } from './templates/convite-aluno'
import { resetSenha } from './templates/reset-senha'
import { cobrancaPendente } from './templates/cobranca-pendente'
import { cobrancaVencida } from './templates/cobranca-vencida'
import { treinoNovo } from './templates/treino-novo'
import { lembreteTreino } from './templates/lembrete-treino'

interface Env {
  SENDGRID_API_KEY: string
  FROM_EMAIL: string
  FROM_NAME: string
  ENVIRONMENT: string
}

interface EmailMessage {
  type: string
  to: string
  data: Record<string, any>
}

function renderTemplate(type: string, data: Record<string, any>): { subject: string; html: string } {
  switch (type) {
    case 'convite_aluno':
      return conviteAluno(data as any)
    case 'reset_senha':
      return resetSenha(data as any)
    case 'cobranca_pendente':
      return cobrancaPendente(data as any)
    case 'cobranca_vencida':
      return cobrancaVencida(data as any)
    case 'treino_novo':
      return treinoNovo(data as any)
    case 'lembrete_treino':
      return lembreteTreino(data as any)
    default:
      throw new Error(`Unknown email template type: ${type}`)
  }
}

export default {
  async queue(batch: MessageBatch<EmailMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const { type, to, data } = msg.body
        const { subject, html } = renderTemplate(type, data)

        await sendEmail(env, { to, subject, html })

        console.log(`✅ Email sent: type=${type} to=${to}`)
        msg.ack()
      } catch (err) {
        console.error(`❌ Email failed: type=${msg.body.type} to=${msg.body.to} error=${err}`)
        msg.retry()
      }
    }
  },
}
