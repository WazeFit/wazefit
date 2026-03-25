export async function sendEmail(
  env: { SENDGRID_API_KEY: string; FROM_EMAIL: string; FROM_NAME: string },
  opts: { to: string; subject: string; html: string; replyTo?: string }
): Promise<void> {
  const body: Record<string, unknown> = {
    personalizations: [{ to: [{ email: opts.to }] }],
    from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
    subject: opts.subject,
    content: [{ type: 'text/html', value: opts.html }],
  }

  if (opts.replyTo) {
    body.reply_to = { email: opts.replyTo }
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SendGrid ${res.status}: ${text}`)
  }
}
