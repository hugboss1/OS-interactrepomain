import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailsService } from '../emails/emails.service';
import { verifyEmailTemplate } from '../emails/templates';

@Injectable()
export class MailerService {
  constructor(
    private readonly config: ConfigService,
    private readonly emails: EmailsService,
  ) {}

  async sendVerificationEmail(to: string, token: string) {
    const baseUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    const { subject, html } = verifyEmailTemplate({ verifyUrl });
    await this.emails.send({ to, subject, html });
  }
}
