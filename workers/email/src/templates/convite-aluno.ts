import { baseLayout, ctaButton } from './base'

interface ConviteAlunoData {
  nome_aluno: string
  nome_tenant: string
  senha_temporaria: string
}

export function conviteAluno(data: ConviteAlunoData): { subject: string; html: string } {
  const subject = `Bem-vindo(a) à ${data.nome_tenant}! 🎉`

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Olá, ${data.nome_aluno}! 👋</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Você foi adicionado(a) à plataforma <strong>${data.nome_tenant}</strong> pelo seu treinador.
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      A partir de agora, você pode acessar seus treinos, acompanhar sua evolução e se comunicar diretamente com seu profissional.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sua senha temporária</p>
        <p style="margin:0;color:#111827;font-size:24px;font-weight:700;font-family:monospace;letter-spacing:2px;">${data.senha_temporaria}</p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.5;">
      Recomendamos alterar sua senha após o primeiro acesso.
    </p>
    ${ctaButton('Acessar Plataforma', 'https://wazefit.com/login')}
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Se você não esperava este email, pode ignorá-lo com segurança.
    </p>
  `

  return { subject, html: baseLayout(content) }
}
