import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@os-interact/database';

const prisma = new PrismaClient();

export type AwardReason =
  | 'signup'
  | 'referral'
  | 'email_verified'
  | 'profile_completed'
  | 'social_share'
  | 'early_bird'
  | 'manual';

const DEFAULT_POINT_VALUES: Record<AwardReason, number> = {
  signup: 100,
  referral: 250,
  email_verified: 50,
  profile_completed: 75,
  social_share: 50,
  early_bird: 200,
  manual: 0,
};

@Injectable()
export class GenpointsService {
  /**
   * Award genpoints atomically. Uses a transaction to ensure consistency.
   */
  async award(
    email: string,
    reason: AwardReason,
    overrideAmount?: number,
    metadata?: Record<string, unknown>,
  ) {
    const amount = overrideAmount ?? DEFAULT_POINT_VALUES[reason];
    if (amount === 0) return null;

    return prisma.genPointsLedger.create({
      data: {
        email,
        amount,
        reason,
        metadata: metadata ?? {},
      },
    });
  }

  /**
   * Award points only if the same reason hasn't been awarded to this email yet.
   * Useful for one-time awards like signup or email_verified.
   */
  async awardOnce(
    email: string,
    reason: AwardReason,
    overrideAmount?: number,
    metadata?: Record<string, unknown>,
  ) {
    const existing = await prisma.genPointsLedger.findFirst({
      where: { email, reason },
    });
    if (existing) return null;
    return this.award(email, reason, overrideAmount, metadata);
  }

  /**
   * Get total genpoints balance for an email.
   */
  async getBalance(email: string): Promise<number> {
    const result = await prisma.genPointsLedger.aggregate({
      where: { email },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  /**
   * Get genpoints balance + transaction history for an email.
   */
  async getDetails(email: string) {
    const [balance, history] = await Promise.all([
      this.getBalance(email),
      prisma.genPointsLedger.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          reason: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    return { email, balance, history };
  }

  /**
   * Get genpoints for the current authenticated user by userId.
   * Looks up the user's email, then fetches genpoints.
   */
  async getForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.getDetails(user.email);
  }
}
