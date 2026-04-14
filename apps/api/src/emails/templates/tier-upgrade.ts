import { emailLayout } from './layout';

/**
 * Notification sent when a user's waitlist tier is upgraded
 * (e.g. standard → vip → elite based on referral milestones).
 * TODO: Final copy (FR + EN) to be provided by CMO/Copywriter.
 */
export function tierUpgradeTemplate(opts: {
  name?: string;
  oldTier: string;
  newTier: string;
  referralCount: number;
  frontendUrl: string;
  locale?: 'en' | 'fr';
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const { name, oldTier, newTier, referralCount, frontendUrl, locale = 'en', unsubscribeUrl } = opts;
  const greeting = name
    ? (locale === 'fr' ? `Félicitations ${name}!` : `Congratulations ${name}!`)
    : (locale === 'fr' ? 'Félicitations!' : 'Congratulations!');

  const tierLabel = (tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1);

  const subject =
    locale === 'fr'
      ? `Niveau supérieur : ${tierLabel(newTier)}!`
      : `Tier upgrade: ${tierLabel(newTier)}!`;

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">${greeting}</h2>
         <p style="color:#3f3f46;line-height:1.6;">Grâce à vos <strong>${referralCount} parrainages</strong>, votre niveau est passé de <strong>${tierLabel(oldTier)}</strong> à <strong>${tierLabel(newTier)}</strong>.</p>
         <p style="color:#3f3f46;line-height:1.6;">Vous bénéficiez maintenant d'avantages exclusifs pour votre nouveau niveau.</p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Découvrir mes avantages</a>
         </p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">${greeting}</h2>
         <p style="color:#3f3f46;line-height:1.6;">Thanks to your <strong>${referralCount} referrals</strong>, your tier has been upgraded from <strong>${tierLabel(oldTier)}</strong> to <strong>${tierLabel(newTier)}</strong>.</p>
         <p style="color:#3f3f46;line-height:1.6;">You now have access to exclusive benefits for your new tier.</p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">View My Benefits</a>
         </p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
