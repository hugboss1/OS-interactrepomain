import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { TurnstileGuard } from './guards/turnstile.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'waitlist-ip', ttl: 3600000, limit: 3 }, // 3 signups per hour per IP
    ]),
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService, TurnstileGuard],
})
export class WaitlistModule {}
