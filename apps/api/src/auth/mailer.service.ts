import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'localhost'),
      port: config.get<number>('SMTP_PORT', 1025),
      secure: false,
      auth: config.get('SMTP_USER')
        ? {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const baseUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const link = `${baseUrl}/auth/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM', 'noreply@osinteract.io'),
      to,
      subject: 'Verify your OS Interact account',
      html: `<p>Click <a href="${link}">here</a> to verify your email address. This link expires in 24 hours.</p>`,
    });
  }
}
