import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@os-interact/database';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { randomBytes } from 'crypto';
import { EmailsService } from '../emails/emails.service';
import {
  waitlistWelcomeTemplate,
  referralNotificationTemplate,
  tierUpgradeTemplate,
} from '../emails/templates';

const prisma = new PrismaClient();

/** Tier thresholds based on referral count */
const TIER_THRESHOLDS: { minReferrals: number; tier: string }[] = [
  { minReferrals: 25, tier: 'elite' },
  { minReferrals: 10, tier: 'vip' },
  { minReferrals: 3, tier: 'silver' },
];

const GENPOINTS_PER_REFERRAL = 50;

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly emails: EmailsService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async join(dto: JoinWaitlistDto) {
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already on waitlist');
    }

    // Validate referral code if provided
    if (dto.referralCode) {
      const referrer = await prisma.waitlistEntry.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (!referrer) {
        throw new BadRequestException('Invalid referral code');
      }
    }

    const newReferralCode = randomBytes(4).toString('hex'); // 8-char hex code
    const position = (await prisma.waitlistEntry.count()) + 1;

    const entry = await prisma.waitlistEntry.create({
      data: {
        email: dto.email,
        name: dto.name,
        referralCode: newReferralCode,
        referredByCode: dto.referralCode ?? null,
        position,
      },
    });

    // Send welcome email (non-blocking)
    this.sendWelcomeEmail(entry).catch((err) => {
      this.logger.error('Failed to send waitlist welcome email', err);
    });

    // Handle referral credit + notifications
    if (dto.referralCode) {
      this.handleReferralCredit(dto.referralCode).catch((err) => {
        this.logger.error('Failed to process referral credit', err);
      });
    }

    return {
      position: entry.position,
      referralCode: entry.referralCode,
      email: entry.email,
    };
  }

  async getLeaderboard(limit = 10) {
    return prisma.waitlistEntry.findMany({
      select: {
        name: true,
        referralCode: true,
        referralCount: true,
        tier: true,
        position: true,
      },
      orderBy: { referralCount: 'desc' },
      take: limit,
    });
  }

  async getEntry(referralCode: string) {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { referralCode },
      select: {
        email: true,
        name: true,
        referralCode: true,
        referralCount: true,
        tier: true,
        position: true,
        createdAt: true,
      },
    });
    if (!entry) throw new BadRequestException('Referral code not found');
    return entry;
  }

  private async sendWelcomeEmail(entry: {
    email: string;
    name: string | null;
    referralCode: string;
    position: number | null;
  }) {
    const { subject, html } = waitlistWelcomeTemplate({
      name: entry.name ?? undefined,
      referralCode: entry.referralCode,
      position: entry.position ?? 0,
      frontendUrl: this.frontendUrl,
    });
    await this.emails.send({ to: entry.email, subject, html });
  }

  private async handleReferralCredit(referralCode: string) {
    const referrer = await prisma.waitlistEntry.update({
      where: { referralCode },
      data: { referralCount: { increment: 1 } },
    });

    // Send referral notification email to referrer
    const { subject, html } = referralNotificationTemplate({
      referrerName: referrer.name ?? undefined,
      newReferralCount: referrer.referralCount,
      genPointsEarned: GENPOINTS_PER_REFERRAL,
      frontendUrl: this.frontendUrl,
    });
    await this.emails.send({ to: referrer.email, subject, html });

    // Check for tier upgrade
    await this.checkTierUpgrade(referrer);
  }

  private async checkTierUpgrade(referrer: {
    id: string;
    email: string;
    name: string | null;
    referralCount: number;
    tier: string;
  }) {
    const newTier = this.computeTier(referrer.referralCount);
    if (newTier && newTier !== referrer.tier) {
      await prisma.waitlistEntry.update({
        where: { id: referrer.id },
        data: { tier: newTier },
      });

      const { subject, html } = tierUpgradeTemplate({
        name: referrer.name ?? undefined,
        oldTier: referrer.tier,
        newTier,
        referralCount: referrer.referralCount,
        frontendUrl: this.frontendUrl,
      });
      await this.emails.send({ to: referrer.email, subject, html });
    }
  }

  private computeTier(referralCount: number): string | null {
    for (const { minReferrals, tier } of TIER_THRESHOLDS) {
      if (referralCount >= minReferrals) return tier;
    }
    return null;
  }
}
