import { baseLayout, ctaButton } from './base'

interface WelcomeData {
  nome: string
  nome_negocio: string
  email: string
  painel_url: string
  reset_url: string
}

export function welcome(data: WelcomeData): { subject: string; html: string } {
  const subject = `Bem-vindo ao WazeFit, ${data.nome}! 🚀`

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:700;">
      Sua plataforma fitness está pronta!
    </h2>

    <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.6;">
      Olá, <strong>${data.nome}</strong>!
    </p>

    <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
      A plataforma da <strong>${data.nome_negocio}</strong> acabou de ser criada com sucesso.
      Agora seus alunos podem treinar com a sua marca, no seu domínio e com a sua identidade.
    </p>

    ${ctaButton('Acessar meu painel', data.painel_url)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f3f4f6;border-radius:12px;border:1px solid #e5e7eb;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;color:#111827;font-size:14px;font-weight:700;">
          🔑 Suas credenciais de acesso
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.5;">
          <strong>Painel:</strong>
          <a href="${data.painel_url}" style="color:#22c55e;text-decoration:none;">${data.painel_url}</a>
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.5;">
          <strong>Email:</strong> ${data.email}
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">
          <strong>Senha:</strong> a que você definiu no cadastro
        </p>
        <p style="margin:12px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          Por segurança nunca enviamos a senha por email.
          Se esquecer, use <a href="${data.reset_url}" style="color:#22c55e;text-decoration:none;">recuperar senha</a> na tela de login.
        </p>
      </td></tr>
    </table>

    <h3 style="margin:32px 0 12px;color:#111827;font-size:18px;font-weight:700;">
      Próximos passos
    </h3>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.5;">
          <strong style="color:#22c55e;">1.</strong>
          <a href="${data.painel_url}/dashboard/config/identidade" style="color:#374151;text-decoration:none;">
            Personalizar identidade visual
          </a> — logo, cores e fonte
        </p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.5;">
          <strong style="color:#22c55e;">2.</strong>
          <a href="${data.painel_url}/dashboard/alunos" style="color:#374151;text-decoration:none;">
            Adicionar seu primeiro aluno
          </a>
        </p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.5;">
          <strong style="color:#22c55e;">3.</strong>
          <a href="${data.painel_url}/dashboard/fichas" style="color:#374151;text-decoration:none;">
            Criar sua primeira ficha de treino
          </a>
        </p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.5;">
          <strong style="color:#22c55e;">4.</strong>
          <a href="${data.painel_url}/dashboard/config/dominios" style="color:#374151;text-decoration:none;">
            Configurar seu domínio próprio
          </a> (opcional)
        </p>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">
      Precisa de ajuda? Responda este email ou escreva para
      <a href="mailto:suporte@wazefit.com" style="color:#22c55e;text-decoration:none;">suporte@wazefit.com</a>.
    </p>
  `

  return { subject, html: baseLayout(content) }
}
