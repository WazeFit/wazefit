export function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#111827;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;color:#22c55e;font-size:28px;font-weight:800;">🏋️ WazeFit</h1>
        </td></tr>
        <!-- Content -->
        <tr><td style="background:#ffffff;padding:32px 24px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 24px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 WazeFit — Plataforma de gestão fitness</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function ctaButton(text: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center">
      <a href="${href}" target="_blank" style="display:inline-block;background:#22c55e;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">${text}</a>
    </td></tr>
  </table>`
}
