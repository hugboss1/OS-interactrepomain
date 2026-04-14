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
      ? "Vous êtes dans la vague — bienvenue sur RIPPLED !"
      : "You're in the wave — welcome to RIPPLED!";

  const body =
    locale === 'fr'
      ? `<h2 style="margin:0 0 16px;color:#18181b;">La vague commence. Vous en faites partie.</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">Votre inscription est confirmée. Vous êtes actuellement <strong>#${position}</strong> sur la liste d'attente RIPPLED — la plateforme de crowdfunding qui récompense chaque action avec des GenPoints.</p>
         <p style="color:#3f3f46;line-height:1.6;margin-top:16px;"><strong>Passez devant tout le monde.</strong> Partagez votre lien de parrainage exclusif et gagnez <strong>+50 GenPoints</strong> pour chaque personne qui s'inscrit :</p>
         <p style="margin:16px 0;padding:14px 16px;background:#f4f4f5;border-radius:6px;font-family:monospace;font-size:13px;word-break:break-all;">
           <a href="${referralLink}" style="color:#6366f1;">${referralLink}</a>
         </p>
         <p style="color:#3f3f46;line-height:1.6;">Plus vous parrainez, plus vous montez. Plus vous montez, plus vous débloquez d'avantages exclusifs.</p>
         <p style="color:#71717a;font-size:13px;margin-top:16px;font-style:italic;">Fund. Progress. Reward. 🌊</p>`
      : `<h2 style="margin:0 0 16px;color:#18181b;">The wave is rising. You're in it.</h2>
         <p style="color:#3f3f46;line-height:1.6;">${greeting}</p>
         <p style="color:#3f3f46;line-height:1.6;">You're confirmed on the RIPPLED waitlist at position <strong>#${position}</strong> — the next-generation crowdfunding platform that rewards every action with GenPoints.</p>
         <p style="color:#3f3f46;line-height:1.6;margin-top:16px;"><strong>Move up the list.</strong> Share your exclusive referral link and earn <strong>+50 GenPoints</strong> for every person who signs up:</p>
         <p style="margin:16px 0;padding:14px 16px;background:#f4f4f5;border-radius:6px;font-family:monospace;font-size:13px;word-break:break-all;">
           <a href="${referralLink}" style="color:#6366f1;">${referralLink}</a>
         </p>
         <p style="color:#3f3f46;line-height:1.6;">The more you refer, the higher you climb. The higher you climb, the more exclusive benefits you unlock.</p>
         <p style="color:#71717a;font-size:13px;margin-top:16px;font-style:italic;">Fund. Progress. Reward. 🌊</p>`;

  return {
    subject,
    html: emailLayout({ title: subject, body, locale, unsubscribeUrl }),
  };
}
