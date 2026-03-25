import { baseLayout, ctaButton } from './base'

interface CobrancaPendenteData {
  nome_aluno: string
  descricao: string
  valor: string
  vencimento: string
  link_pagamento: string
}

export function cobrancaPendente(data: CobrancaPendenteData): { subject: string; html: string } {
  const subject = `Lembrete de pagamento — ${data.descricao}`

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Lembrete de pagamento 📋</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Olá, <strong>${data.nome_aluno}</strong>!
    </p>
    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      Este é um lembrete amigável sobre um pagamento pendente na sua conta.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Descrição</td>
            <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${data.descricao}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Valor</td>
            <td style="padding:8px 0;border-top:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;text-align:right;">R$ ${data.valor}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Vencimento</td>
            <td style="padding:8px 0;border-top:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;text-align:right;">${data.vencimento}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    ${ctaButton('Pagar Agora', data.link_pagamento)}
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Se você já realizou o pagamento, desconsidere este email.
    </p>
  `

  return { subject, html: baseLayout(content) }
}
