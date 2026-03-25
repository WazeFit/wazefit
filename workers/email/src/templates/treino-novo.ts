import { baseLayout, ctaButton } from './base'

interface TreinoNovoData {
  nome_aluno: string
  nome_ficha: string
  nome_expert: string
}

export function treinoNovo(data: TreinoNovoData): { subject: string; html: string } {
  const subject = 'Novo treino disponível! 💪'

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Novo treino disponível! 💪</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Olá, <strong>${data.nome_aluno}</strong>!
    </p>
    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      Seu treinador <strong>${data.nome_expert}</strong> preparou um novo treino especialmente para você. Confira os detalhes na plataforma!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0 0 4px;color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ficha de treino</p>
        <p style="margin:0;color:#111827;font-size:20px;font-weight:700;">${data.nome_ficha}</p>
      </td></tr>
    </table>
    ${ctaButton('Ver Treino', 'https://wazefit.com/treinos')}
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Bons treinos! 🏋️
    </p>
  `

  return { subject, html: baseLayout(content) }
}
