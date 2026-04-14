import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

@Injectable()
export class TurnstileGuard implements CanActivate {
  private readonly logger = new Logger(TurnstileGuard.name);
  private readonly secretKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!this.secretKey) {
      this.logger.warn(
        'TURNSTILE_SECRET_KEY not set — CAPTCHA verification disabled',
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.secretKey) return true; // CAPTCHA not configured yet — allow through

    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.body?.cfTurnstileToken;

    if (!token) {
      throw new ForbiddenException('CAPTCHA token required');
    }

    const ip = request.ip ?? request.headers['x-forwarded-for'] ?? '';

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: this.secretKey,
        response: token,
        remoteip: typeof ip === 'string' ? ip : ip[0],
      }),
    });

    const data = (await res.json()) as { success: boolean };

    if (!data.success) {
      throw new ForbiddenException('CAPTCHA verification failed');
    }

    return true;
  }
}
