import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailerService } from './mailer.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    const verificationToken = this.issueVerificationToken(user.id, user.email);
    this.mailer.sendVerificationEmail(user.email, verificationToken).catch(() => {
      // Email failures are non-blocking
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email);
  }

  async loginOAuthUser(user: { id: string; email: string }) {
    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(_refreshToken: string) {
    // Stateless JWT: handled client-side. Add Redis denylist here for server-side invalidation.
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        purpose: string;
      }>(token, {
        secret: this.config.get<string>(
          'JWT_VERIFY_SECRET',
          this.config.get<string>('JWT_SECRET')!,
        ),
      });
      if (payload.purpose !== 'email_verification') {
        throw new BadRequestException('Invalid verification token');
      }
      await this.usersService.markEmailVerified(payload.sub);
      return { message: 'Email verified successfully' };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerified) {
      return { message: 'If that email exists and is unverified, a new link has been sent.' };
    }
    const token = this.issueVerificationToken(user.id, user.email);
    await this.mailer.sendVerificationEmail(user.email, token);
    return { message: 'If that email exists and is unverified, a new link has been sent.' };
  }

  private issueVerificationToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email, purpose: 'email_verification' },
      {
        secret: this.config.get<string>(
          'JWT_VERIFY_SECRET',
          this.config.get<string>('JWT_SECRET')!,
        ),
        expiresIn: '24h',
      },
    );
  }

  private issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    };
  }
}
