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
      ? `Vous passez ${tierLabel(newTier)} — accès exclusif débloqué !`
      : `You're now ${tierLabel(newTier)} — exclusive access unlocked!`;

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">${greeting} Vous avez atteint le niveau ${tierLabel(newTier)}.</h2>
         <p style="color:#3f3f46;line-height:1.6;">Grâce à vos <strong>${referralCount} parrainages</strong>, vous passez du niveau <strong>${tierLabel(oldTier)}</strong> au niveau <strong>${tierLabel(newTier)}</strong>. C'est mérité.</p>
         <p style="margin:20px 0;padding:16px;background:#f0f0ff;border-left:4px solid #6366f1;border-radius:4px;">
           <span style="font-size:18px;font-weight:bold;color:#6366f1;">🏆 Niveau ${tierLabel(newTier)} activé</span><br/>
           <span style="color:#3f3f46;font-size:13px;margin-top:4px;display:block;">Des avantages exclusifs vous attendent sur votre tableau de bord.</span>
         </p>
         <p style="color:#3f3f46;line-height:1.6;">Continuez à inviter votre réseau — chaque parrainage vous rapproche du prochain niveau et de récompenses encore plus importantes.</p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">Découvrir mes avantages →</a>
         </p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">${greeting} You've reached ${tierLabel(newTier)} tier.</h2>
         <p style="color:#3f3f46;line-height:1.6;">With <strong>${referralCount} referrals</strong>, you've climbed from <strong>${tierLabel(oldTier)}</strong> to <strong>${tierLabel(newTier)}</strong>. You've earned it.</p>
         <p style="margin:20px 0;padding:16px;background:#f0f0ff;border-left:4px solid #6366f1;border-radius:4px;">
           <span style="font-size:18px;font-weight:bold;color:#6366f1;">🏆 ${tierLabel(newTier)} tier activated</span><br/>
           <span style="color:#3f3f46;font-size:13px;margin-top:4px;display:block;">Exclusive benefits are waiting for you on your dashboard.</span>
         </p>
         <p style="color:#3f3f46;line-height:1.6;">Keep inviting your network — every referral brings you closer to the next tier and even greater rewards.</p>
         <p style="margin:24px 0;">
           <a href="${frontendUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">View my benefits →</a>
         </p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
