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
      ? `+${genPointsEarned} GenPoints gagnés — quelqu'un a rejoint votre vague !`
      : `+${genPointsEarned} GenPoints earned — someone just joined your wave!`;

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">Votre réseau s'agrandit. Vos points aussi.</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Quelqu'un vient de rejoindre RIPPLED via votre lien de parrainage. La vague se propage !</p>
         <p style="margin:20px 0;padding:16px;background:#f0f0ff;border-left:4px solid #6366f1;border-radius:4px;">
           <span style="font-size:22px;font-weight:bold;color:#6366f1;">+${genPointsEarned} GenPoints</span><br/>
           <span style="color:#3f3f46;font-size:13px;">Total de parrainages : <strong>${newReferralCount}</strong></span>
         </p>
         <p style="color:#3f3f46;line-height:1.6;">Continuez à partager votre lien et accumulez des GenPoints pour débloquer des niveaux exclusifs.</p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">Voir mon tableau de bord →</a>
         </p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">Your network grows. Your rewards too.</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Someone just joined RIPPLED through your referral link. The wave is spreading!</p>
         <p style="margin:20px 0;padding:16px;background:#f0f0ff;border-left:4px solid #6366f1;border-radius:4px;">
           <span style="font-size:22px;font-weight:bold;color:#6366f1;">+${genPointsEarned} GenPoints</span><br/>
           <span style="color:#3f3f46;font-size:13px;">Total referrals: <strong>${newReferralCount}</strong></span>
         </p>
         <p style="color:#3f3f46;line-height:1.6;">Keep sharing your link and stack GenPoints to unlock exclusive tiers and benefits.</p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">View my dashboard →</a>
         </p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
