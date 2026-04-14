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
      ? 'Un clic pour confirmer — votre aventure RIPPLED commence ici'
      : 'One click to confirm — your RIPPLED journey starts here';

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">Confirmez votre adresse email</h2>
         <p style="color:#3f3f46;line-height:1.6;">Vous êtes à un clic de rejoindre la plateforme de crowdfunding de nouvelle génération. Vérifiez votre adresse email pour accéder à votre compte et commencer à accumuler des GenPoints.</p>
         <p style="color:#3f3f46;line-height:1.6;">Ce lien est valable <strong>24 heures</strong>.</p>
         <p style="margin:24px 0;">
           <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">Vérifier mon email →</a>
         </p>
         <p style="color:#71717a;font-size:13px;">Si vous n'avez pas créé de compte sur RIPPLED, vous pouvez ignorer cet email en toute sécurité.</p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">Confirm your email address</h2>
         <p style="color:#3f3f46;line-height:1.6;">You're one click away from joining the next-generation crowdfunding platform. Verify your email to activate your account and start earning GenPoints.</p>
         <p style="color:#3f3f46;line-height:1.6;">This link is valid for <strong>24 hours</strong>.</p>
         <p style="margin:24px 0;">
           <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">Verify my email →</a>
         </p>
         <p style="color:#71717a;font-size:13px;">If you didn't sign up for RIPPLED, you can safely ignore this email.</p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
