/**
 * Shared email layout wrapper. All emails use this to get consistent branding
 * and a GDPR-compliant unsubscribe footer.
 */
export function emailLayout(opts: {
  title: string;
  body: string;
  unsubscribeUrl?: string;
  locale?: 'en' | 'fr';
}): string {
  const { title, body, locale = 'en' } = opts;
  const unsubscribeUrl = opts.unsubscribeUrl ?? '#';

  const footerText =
    locale === 'fr'
      ? `Vous recevez cet email car vous êtes inscrit(e) sur OS Interact. <a href="${unsubscribeUrl}" style="color:#6366f1;">Se désinscrire</a>`
      : `You're receiving this email because you signed up for OS Interact. <a href="${unsubscribeUrl}" style="color:#6366f1;">Unsubscribe</a>`;

  const companyLine =
    locale === 'fr'
      ? 'OS Interact Inc. — Tous droits réservés.'
      : 'OS Interact Inc. — All rights reserved.';

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:bold;">OS Interact</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;line-height:1.5;">
              <p style="margin:0 0 8px;">${footerText}</p>
              <p style="margin:0;">${companyLine}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
