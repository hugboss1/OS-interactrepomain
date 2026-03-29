import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaClient } from '@os-interact/database';

const prisma = new PrismaClient();

@Injectable()
export class PledgesService {
  private stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY')!);
  }

  async create(projectId: string, backerId: string, amount: number) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { projectId, backerId },
    });

    const pledge = await prisma.pledge.create({
      data: {
        projectId,
        backerId,
        amount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    });

    return { pledge, clientSecret: paymentIntent.client_secret };
  }

  listByProject(projectId: string) {
    return prisma.pledge.findMany({
      where: { projectId },
      select: { id: true, amount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
