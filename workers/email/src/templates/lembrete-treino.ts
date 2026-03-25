import { baseLayout, ctaButton } from './base'

interface LembreteTreinoData {
  nome_aluno: string
  nome_ficha: string
  dia_semana: string
}

export function lembreteTreino(data: LembreteTreinoData): { subject: string; html: string } {
  const subject = 'Hora de treinar! 🏋️'

  const motivationalPhrases = [
    'Cada repetição te deixa mais forte!',
    'O treino de hoje é o resultado de amanhã!',
    'Disciplina supera motivação. Bora treinar!',
    'Seu corpo agradece cada treino!',
  ]
  const phrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Hora de treinar! 🏋️</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      E aí, <strong>${data.nome_aluno}</strong>!
    </p>
    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      Hoje é <strong>${data.dia_semana}</strong> e você tem treino programado. Não deixe pra depois!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0 0 4px;color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Treino de hoje</p>
        <p style="margin:0;color:#111827;font-size:20px;font-weight:700;">${data.nome_ficha}</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
      <tr><td style="padding:14px 20px;text-align:center;">
        <p style="margin:0;color:#1e40af;font-size:15px;font-style:italic;line-height:1.5;">
          💡 "${phrase}"
        </p>
      </td></tr>
    </table>
    ${ctaButton('Iniciar Treino', 'https://wazefit.com/treinos')}
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Bons treinos! 💪
    </p>
  `

  return { subject, html: baseLayout(content) }
}
