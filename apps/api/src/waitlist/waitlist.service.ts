import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaClient } from '@os-interact/database';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

@Injectable()
export class WaitlistService {
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

    // Increment referrer's count atomically — this is the bug fix:
    // We use Prisma's { increment: 1 } which generates
    // UPDATE waitlist SET referral_count = referral_count + 1
    // instead of overwriting with the new user's referral_count (0).
    if (dto.referralCode) {
      await prisma.waitlistEntry.update({
        where: { referralCode: dto.referralCode },
        data: { referralCount: { increment: 1 } },
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
}
