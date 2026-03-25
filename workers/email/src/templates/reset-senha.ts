import { baseLayout, ctaButton } from './base'

interface ResetSenhaData {
  nome: string
  link_reset: string
}

export function resetSenha(data: ResetSenhaData): { subject: string; html: string } {
  const subject = 'Redefinir sua senha — WazeFit'

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Redefinição de senha</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Olá, <strong>${data.nome}</strong>!
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta no WazeFit. Clique no botão abaixo para criar uma nova senha:
    </p>
    ${ctaButton('Redefinir Senha', data.link_reset)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
      <tr><td style="padding:14px 20px;">
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.5;">
          ⏰ Este link expira em <strong>1 hora</strong>. Após esse período, será necessário solicitar uma nova redefinição.
        </p>
      </td></tr>
    </table>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
    </p>
  `

  return { subject, html: baseLayout(content) }
}
