import { emailLayout } from './layout';

/**
 * Notification sent to a referrer when someone joins via their referral link.
 * TODO: Final copy (FR + EN) to be provided by CMO/Copywriter.
 */
export function referralNotificationTemplate(opts: {
  referrerName?: string;
  newReferralCount: number;
  genPointsEarned: number;
  frontendUrl: string;
  locale?: 'en' | 'fr';
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const { referrerName, newReferralCount, genPointsEarned, frontendUrl, locale = 'en', unsubscribeUrl } = opts;
  const greeting = referrerName
    ? (locale === 'fr' ? `Bonjour ${referrerName},` : `Hi ${referrerName},`)
    : (locale === 'fr' ? 'Bonjour,' : 'Hi,');

  const subject =
    locale === 'fr'
      ? `+${genPointsEarned} GenPoints — Nouveau parrainage!`
      : `+${genPointsEarned} GenPoints — New referral!`;

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">Nouveau parrainage!</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Quelqu'un vient de rejoindre la liste d'attente via votre lien de parrainage.</p>
         <p style="color:#3f3f46;line-height:1.6;">Vous avez gagné <strong>+${genPointsEarned} GenPoints</strong>!</p>
         <p style="color:#3f3f46;line-height:1.6;">Total de parrainages : <strong>${newReferralCount}</strong></p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Voir mon tableau de bord</a>
         </p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">New referral!</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Someone just joined the waitlist using your referral link.</p>
         <p style="color:#3f3f46;line-height:1.6;">You earned <strong>+${genPointsEarned} GenPoints</strong>!</p>
         <p style="color:#3f3f46;line-height:1.6;">Total referrals: <strong>${newReferralCount}</strong></p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">View Dashboard</a>
         </p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
