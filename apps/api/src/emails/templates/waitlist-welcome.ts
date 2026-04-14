import { emailLayout } from './layout';

/**
 * Welcome email sent after a user joins the waitlist and confirms their email.
 * TODO: Final copy (FR + EN) to be provided by CMO/Copywriter.
 */
export function waitlistWelcomeTemplate(opts: {
  name?: string;
  referralCode: string;
  position: number;
  frontendUrl: string;
  locale?: 'en' | 'fr';
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const { name, referralCode, position, frontendUrl, locale = 'en', unsubscribeUrl } = opts;
  const referralLink = `${frontendUrl}?ref=${referralCode}`;
  const greeting = name ? (locale === 'fr' ? `Bonjour ${name},` : `Hi ${name},`) : (locale === 'fr' ? 'Bonjour,' : 'Hi,');

  const subject =
    locale === 'fr'
      ? "Bienvenue sur la liste d'attente OS Interact!"
      : "Welcome to the OS Interact waitlist!";

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">Vous êtes inscrit(e)!</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Votre position actuelle : <strong>#${position}</strong></p>
         <p style="color:#3f3f46;line-height:1.6;">Partagez votre lien de parrainage pour monter dans la file et gagner des GenPoints :</p>
         <p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px;font-family:monospace;word-break:break-all;">
           <a href="${referralLink}" style="color:#6366f1;">${referralLink}</a>
         </p>
         <p style="color:#71717a;font-size:13px;">Chaque ami qui s'inscrit via votre lien vous rapporte +50 GenPoints!</p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">You're on the list!</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Your current position: <strong>#${position}</strong></p>
         <p style="color:#3f3f46;line-height:1.6;">Share your referral link to move up and earn GenPoints:</p>
         <p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:6px;font-family:monospace;word-break:break-all;">
           <a href="${referralLink}" style="color:#6366f1;">${referralLink}</a>
         </p>
         <p style="color:#71717a;font-size:13px;">Each friend who joins via your link earns you +50 GenPoints!</p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
