import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@os-interact/database';
import { EmailsService } from '../emails/emails.service';
import { ConfigService } from '@nestjs/config';
import { waitlistWelcomeTemplate } from '../emails/templates';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly emails: EmailsService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async listWaitlist(opts: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const sortBy = opts.sortBy ?? 'position';
    const sortOrder = opts.sortOrder ?? 'asc';
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 50;
    const skip = (page - 1) * limit;

    const allowedSorts = ['position', 'email', 'referralCount', 'tier', 'status', 'createdAt'];
    const orderByField = allowedSorts.includes(sortBy) ? sortBy : 'position';

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        orderBy: { [orderByField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.waitlistEntry.count(),
    ]);

    return { entries, total, page, limit };
  }

  async exportCsv(): Promise<string> {
    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { position: 'asc' },
    });

    const header = 'position,email,name,referral_code,referral_count,referred_by_code,tier,status,created_at';
    const rows = entries.map((e: typeof entries[number]) =>
      [
        e.position ?? '',
        `"${e.email}"`,
        `"${(e.name ?? '').replace(/"/g, '""')}"`,
        e.referralCode,
        e.referralCount,
        e.referredByCode ?? '',
        e.tier,
        e.status,
        e.createdAt.toISOString(),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async banEntry(id: string) {
    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    if (entry.status === 'banned') throw new BadRequestException('Already banned');

    return prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'banned' },
    });
  }

  async unbanEntry(id: string) {
    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    if (entry.status !== 'banned') throw new BadRequestException('Not banned');

    return prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'active' },
    });
  }

  async resendConfirmation(id: string) {
    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');

    const { subject, html } = waitlistWelcomeTemplate({
      name: entry.name ?? undefined,
      referralCode: entry.referralCode,
      position: entry.position ?? 0,
      frontendUrl: this.frontendUrl,
    });

    await this.emails.send({ to: entry.email, subject, html });
    return { message: `Confirmation resent to ${entry.email}` };
  }

  async grantGenpoints(id: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: { referralCount: { increment: amount } },
    });

    this.logger.log(`Granted ${amount} genpoints to ${entry.email} (admin action)`);
    return updated;
  }
}
