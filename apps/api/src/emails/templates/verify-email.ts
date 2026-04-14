import { emailLayout } from './layout';

/**
 * Email verification template — sent when a user registers an account.
 * Replaces the inline HTML previously in auth/mailer.service.ts.
 */
export function verifyEmailTemplate(opts: {
  verifyUrl: string;
  locale?: 'en' | 'fr';
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const { verifyUrl, locale = 'en', unsubscribeUrl } = opts;

  const subject =
    locale === 'fr'
      ? 'Vérifiez votre compte OS Interact'
      : 'Verify your OS Interact account';

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">Vérification de votre email</h2>
         <p style="color:#3f3f46;line-height:1.6;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email. Ce lien expire dans 24 heures.</p>
         <p style="margin:24px 0;">
           <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Vérifier mon email</a>
         </p>
         <p style="color:#71717a;font-size:13px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">Verify your email</h2>
         <p style="color:#3f3f46;line-height:1.6;">Click the button below to verify your email address. This link expires in 24 hours.</p>
         <p style="margin:24px 0;">
           <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Verify Email</a>
         </p>
         <p style="color:#71717a;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
