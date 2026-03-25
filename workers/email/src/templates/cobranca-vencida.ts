import { baseLayout, ctaButton } from './base'

interface CobrancaVencidaData {
  nome_aluno: string
  descricao: string
  valor: string
  vencimento: string
  dias_atraso: number
  link_pagamento: string
}

export function cobrancaVencida(data: CobrancaVencidaData): { subject: string; html: string } {
  const subject = `⚠️ Pagamento vencido — ${data.descricao}`

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Pagamento em atraso ⚠️</h2>
    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Olá, <strong>${data.nome_aluno}</strong>!
    </p>
    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      Identificamos que você possui um pagamento vencido. Regularize sua situação para continuar aproveitando todos os recursos da plataforma.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Descrição</td>
            <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${data.descricao}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-top:1px solid #fecaca;color:#6b7280;font-size:14px;">Valor</td>
            <td style="padding:8px 0;border-top:1px solid #fecaca;color:#111827;font-size:14px;font-weight:600;text-align:right;">R$ ${data.valor}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-top:1px solid #fecaca;color:#6b7280;font-size:14px;">Vencimento</td>
            <td style="padding:8px 0;border-top:1px solid #fecaca;color:#111827;font-size:14px;font-weight:600;text-align:right;">${data.vencimento}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-top:1px solid #fecaca;color:#dc2626;font-size:14px;font-weight:600;">Dias em atraso</td>
            <td style="padding:8px 0;border-top:1px solid #fecaca;color:#dc2626;font-size:14px;font-weight:700;text-align:right;">${data.dias_atraso} dia${data.dias_atraso > 1 ? 's' : ''}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    ${ctaButton('Regularizar Pagamento', data.link_pagamento)}
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Se você já realizou o pagamento, desconsidere este email. Em caso de dúvidas, entre em contato com seu profissional.
    </p>
  `

  return { subject, html: baseLayout(content) }
}
