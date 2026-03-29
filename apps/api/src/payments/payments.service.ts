import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaClient } from '@os-interact/database';

const prisma = new PrismaClient();

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(config.get<string>('STRIPE_SECRET_KEY')!);
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET')!;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.pledge.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: 'succeeded' },
      });
      // Update project's raisedAmount
      const pledge = await prisma.pledge.findFirst({
        where: { stripePaymentIntentId: pi.id },
      });
      if (pledge) {
        await prisma.project.update({
          where: { id: pledge.projectId },
          data: { raisedAmount: { increment: pledge.amount } },
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.pledge.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: 'failed' },
      });
    }

    return { received: true };
  }
}
