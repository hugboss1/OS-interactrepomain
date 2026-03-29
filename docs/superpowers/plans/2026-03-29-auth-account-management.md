# Auth & Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the scaffolded NestJS auth module with OAuth (Google/GitHub), email verification, and corresponding Next.js frontend pages for login, register, OAuth callback, email verification, and profile management.

**Architecture:** Backend uses Passport.js OAuth2 strategies (Google, GitHub) that either find an existing user by provider ID or create a new one; email verification uses short-lived signed JWTs sent via Nodemailer. Frontend stores access/refresh tokens in localStorage, refreshes on 401, and uses React Query for user state.

**Tech Stack:** NestJS 10, Passport.js, passport-google-oauth20, passport-github2, Nodemailer, Next.js 14 App Router, TailwindCSS, React Query v5, TypeScript.

---

## File Map

**Modify:**
- `packages/database/prisma/schema.prisma` — add `emailVerified`, `oauthProvider`, `oauthProviderId` to User; make `passwordHash` optional
- `apps/api/src/auth/auth.service.ts` — add OAuth user upsert, email verification methods
- `apps/api/src/auth/auth.controller.ts` — add OAuth routes, email verification routes
- `apps/api/src/auth/auth.module.ts` — register GoogleStrategy, GithubStrategy, MailerService
- `apps/api/src/users/users.service.ts` — add `findByOAuth`, `upsertOAuthUser`
- `apps/web/src/app/layout.tsx` — add AuthNav header

**Create:**
- `apps/api/src/auth/strategies/google.strategy.ts`
- `apps/api/src/auth/strategies/github.strategy.ts`
- `apps/api/src/auth/dto/verify-email.dto.ts`
- `apps/api/src/auth/dto/resend-verification.dto.ts`
- `apps/api/src/auth/mailer.service.ts`
- `apps/web/src/lib/auth.ts` — typed API calls
- `apps/web/src/lib/auth-store.ts` — token storage + reactive user state
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/auth/callback/page.tsx` — OAuth callback (receives token from redirect)
- `apps/web/src/app/auth/verify-email/page.tsx`
- `apps/web/src/app/profile/page.tsx`
- `apps/web/src/components/AuthNav.tsx`

---

## Task 1: Prisma Schema — OAuth + Email Verification Fields

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Update User model**

Replace the `passwordHash` line and add new fields so the model reads:

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String?   @map("password_hash")
  name           String
  avatarUrl      String?   @map("avatar_url")
  emailVerified  Boolean   @default(false) @map("email_verified")
  oauthProvider  String?   @map("oauth_provider")
  oauthProviderId String?  @map("oauth_provider_id")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  projects Project[]
  pledges  Pledge[]

  @@unique([oauthProvider, oauthProviderId])
  @@map("users")
}
```

- [ ] **Step 2: Generate migration**

```bash
cd packages/database
npx prisma migrate dev --name add_oauth_email_verified
```

Expected: migration file created in `prisma/migrations/`, client regenerated with no errors.

- [ ] **Step 3: Verify client types**

```bash
npx prisma generate
```

Expected: no errors; `PrismaClient` now exposes `emailVerified`, `oauthProvider`, `oauthProviderId` on the `User` type.

- [ ] **Step 4: Commit**

```bash
git add packages/database/prisma/
git commit -m "feat(db): add oauth fields and emailVerified to User

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 2: Install Backend OAuth + Mail Packages

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Add dependencies**

```bash
cd apps/api
pnpm add passport-google-oauth20 passport-github2 nodemailer
pnpm add -D @types/passport-google-oauth20 @types/passport-github2 @types/nodemailer
```

Expected: packages appear in `apps/api/package.json`; `pnpm install` succeeds.

- [ ] **Step 2: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): add passport-google, passport-github2, nodemailer

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 3: UsersService — OAuth User Upsert

**Files:**
- Modify: `apps/api/src/users/users.service.ts`

- [ ] **Step 1: Add `upsertOAuthUser` and `findByOAuth` methods**

Replace the entire file content:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@os-interact/database';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  findByOAuth(provider: string, providerId: string) {
    return prisma.user.findUnique({
      where: { oauthProvider_oauthProviderId: { oauthProvider: provider, oauthProviderId: providerId } },
    });
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({ data });
  }

  upsertOAuthUser(data: {
    email: string;
    name: string;
    avatarUrl?: string;
    oauthProvider: string;
    oauthProviderId: string;
  }) {
    return prisma.user.upsert({
      where: {
        oauthProvider_oauthProviderId: {
          oauthProvider: data.oauthProvider,
          oauthProviderId: data.oauthProviderId,
        },
      },
      update: { name: data.name, avatarUrl: data.avatarUrl },
      create: { ...data, emailVerified: true },
    });
  }

  markEmailVerified(id: string) {
    return prisma.user.update({ where: { id }, data: { emailVerified: true } });
  }

  update(id: string, data: { name?: string; avatarUrl?: string }) {
    return prisma.user.update({ where: { id }, data });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/users/users.service.ts
git commit -m "feat(users): add OAuth upsert and markEmailVerified methods

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 4: MailerService

**Files:**
- Create: `apps/api/src/auth/mailer.service.ts`

- [ ] **Step 1: Create the mailer service**

```typescript
// apps/api/src/auth/mailer.service.ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/auth/mailer.service.ts
git commit -m "feat(auth): add MailerService for email verification

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 5: Google + GitHub OAuth Strategies

**Files:**
- Create: `apps/api/src/auth/strategies/google.strategy.ts`
- Create: `apps/api/src/auth/strategies/github.strategy.ts`

- [ ] **Step 1: Create Google strategy**

```typescript
// apps/api/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3001/v1/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName ?? profile.username ?? 'Google User';
    const avatarUrl = profile.photos?.[0]?.value;
    if (!email) return done(new Error('No email from Google'), false);

    const user = await this.usersService.upsertOAuthUser({
      email,
      name,
      avatarUrl,
      oauthProvider: 'google',
      oauthProviderId: profile.id,
    });
    done(null, user);
  }
}
```

- [ ] **Step 2: Create GitHub strategy**

```typescript
// apps/api/src/auth/strategies/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID', ''),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL', 'http://localhost:3001/v1/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName ?? profile.username ?? 'GitHub User';
    const avatarUrl = (profile as { _json?: { avatar_url?: string } })._json?.avatar_url;
    if (!email) return done(new Error('No email from GitHub'));

    const user = await this.usersService.upsertOAuthUser({
      email,
      name,
      avatarUrl,
      oauthProvider: 'github',
      oauthProviderId: String(profile.id),
    });
    done(null, user);
  }
}
```

- [ ] **Step 3: Create OAuth guard helper**

```typescript
// apps/api/src/auth/guards/google-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
```

```typescript
// apps/api/src/auth/guards/github-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/strategies/google.strategy.ts apps/api/src/auth/strategies/github.strategy.ts apps/api/src/auth/guards/
git commit -m "feat(auth): add Google and GitHub OAuth strategies and guards

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 6: Email Verification DTOs

**Files:**
- Create: `apps/api/src/auth/dto/verify-email.dto.ts`
- Create: `apps/api/src/auth/dto/resend-verification.dto.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// apps/api/src/auth/dto/verify-email.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}
```

```typescript
// apps/api/src/auth/dto/resend-verification.dto.ts
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/auth/dto/
git commit -m "feat(auth): add email verification DTOs

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 7: AuthService — OAuth + Email Verification Methods

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`

- [ ] **Step 1: Replace auth.service.ts with full implementation**

```typescript
// apps/api/src/auth/auth.service.ts
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
    // Send verification email (non-blocking)
    const verificationToken = this.issueVerificationToken(user.id, user.email);
    this.mailer.sendVerificationEmail(user.email, verificationToken).catch(() => {
      // Email failures are logged but do not block registration
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
      const payload = this.jwtService.verify<{ sub: string; email: string; purpose: string }>(
        token,
        { secret: this.config.get<string>('JWT_VERIFY_SECRET', this.config.get<string>('JWT_SECRET')!) },
      );
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
    if (!user || user.emailVerified) return { message: 'If that email exists and is unverified, a new link has been sent.' };
    const token = this.issueVerificationToken(user.id, user.email);
    await this.mailer.sendVerificationEmail(user.email, token);
    return { message: 'If that email exists and is unverified, a new link has been sent.' };
  }

  private issueVerificationToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email, purpose: 'email_verification' },
      {
        secret: this.config.get<string>('JWT_VERIFY_SECRET', this.config.get<string>('JWT_SECRET')!),
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/auth/auth.service.ts
git commit -m "feat(auth): add OAuth login, email verification, resend methods

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 8: AuthController — OAuth + Email Verification Routes

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 1: Replace auth.controller.ts**

```typescript
// apps/api/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout (invalidate refresh token)' })
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // Passport redirects automatically
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Request() req: { user: { id: string; email: string } },
    @Res() res: FastifyReply,
  ) {
    const tokens = await this.authService.loginOAuthUser(req.user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  githubAuth() {
    // Passport redirects automatically
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubCallback(
    @Request() req: { user: { id: string; email: string } },
    @Res() res: FastifyReply,
  ) {
    const tokens = await this.authService.loginOAuthUser(req.user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/auth/auth.controller.ts
git commit -m "feat(auth): add OAuth and email verification routes

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 9: Auth Module — Register New Providers

**Files:**
- Modify: `apps/api/src/auth/auth.module.ts`

- [ ] **Step 1: Update auth.module.ts**

```typescript
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService, JwtStrategy, LocalStrategy, GoogleStrategy, GithubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 2: Verify full build**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/auth/auth.module.ts
git commit -m "feat(auth): register OAuth strategies and MailerService in AuthModule

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 10: Frontend — Auth Store + API Client

**Files:**
- Create: `apps/web/src/lib/auth-store.ts`
- Create: `apps/web/src/lib/auth.ts`

- [ ] **Step 1: Create auth-store.ts**

```typescript
// apps/web/src/lib/auth-store.ts
'use client';

const ACCESS_KEY = 'osi_access';
const REFRESH_KEY = 'osi_refresh';

export const authStore = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  isLoggedIn(): boolean {
    return Boolean(this.getAccessToken());
  },
};
```

- [ ] **Step 2: Create auth.ts API client**

```typescript
// apps/web/src/lib/auth.ts
import { apiFetch } from './api';
import { authStore } from './auth-store';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  authStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  authStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function logout(): Promise<void> {
  const refreshToken = authStore.getRefreshToken();
  if (refreshToken) {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  authStore.clear();
}

export async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const tokens = await apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  authStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export function getMe(): Promise<UserProfile> {
  const token = authStore.getAccessToken();
  return apiFetch<UserProfile>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateProfile(data: { name?: string; avatarUrl?: string }): Promise<UserProfile> {
  const token = authStore.getAccessToken();
  return apiFetch<UserProfile>('/users/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/auth-store.ts apps/web/src/lib/auth.ts
git commit -m "feat(web): add auth store and API client

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 11: Frontend — Auth Layout + Login Page

**Files:**
- Create: `apps/web/src/app/(auth)/layout.tsx`
- Create: `apps/web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create auth layout**

```tsx
// apps/web/src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create login page**

```tsx
// apps/web/src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
      <p className="text-gray-500 text-sm mb-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-500 bg-white px-2">or</div>
        </div>
        <a
          href={`${API_URL}/auth/google`}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.6 0 6.6 5.4 2.5 13.3l7.9 6.1C12.4 13 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.4-4.7 7l7.3 5.7c4.3-3.9 6.8-9.7 6.8-16.7z"/>
            <path fill="#FBBC05" d="M10.4 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.9-4.6l-7.9-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.9-6.1z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2.2 1.5-5 2.4-8.6 2.4-6.3 0-11.6-3.5-13.6-8.5l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/>
          </svg>
          Continue with Google
        </a>
        <a
          href={`${API_URL}/auth/github`}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 10 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 20 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(auth\)/
git commit -m "feat(web): add auth layout and login page with OAuth buttons

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 12: Frontend — Register Page

**Files:**
- Create: `apps/web/src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create register page**

```tsx
// apps/web/src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
      <p className="text-gray-500 text-sm mb-6">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(auth\)/register/
git commit -m "feat(web): add register page

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 13: Frontend — OAuth Callback + Email Verify Pages

**Files:**
- Create: `apps/web/src/app/auth/callback/page.tsx`
- Create: `apps/web/src/app/auth/verify-email/page.tsx`

- [ ] **Step 1: Create OAuth callback page**

```tsx
// apps/web/src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStore } from '@/lib/auth-store';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      authStore.setTokens(accessToken, refreshToken);
      router.replace('/');
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Completing sign in…</p>
    </div>
  );
}
```

- [ ] **Step 2: Create email verify page**

```tsx
// apps/web/src/app/auth/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/auth';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
      });
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'loading' && <p className="text-gray-500">Verifying your email…</p>}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link href="/" className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition">
              Go to home
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link href="/login" className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/auth/
git commit -m "feat(web): add OAuth callback and email verification pages

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 14: Frontend — Profile Page + AuthNav

**Files:**
- Create: `apps/web/src/app/profile/page.tsx`
- Create: `apps/web/src/components/AuthNav.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create profile page**

```tsx
// apps/web/src/app/profile/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getMe, updateProfile, logout, resendVerification } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const [name, setName] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => updateProfile({ name: name || user?.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSaveMsg('Profile updated.');
      setTimeout(() => setSaveMsg(''), 3000);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerification(user!.email),
    onSuccess: (res) => setSaveMsg(res.message),
  });

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>;
  if (!user) { router.push('/login'); return null; }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</p>
          <div className="flex items-center gap-2">
            <p className="text-gray-700">{user.email}</p>
            {user.emailVerified ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
            ) : (
              <button
                onClick={() => resendMutation.mutate()}
                className="text-xs text-brand-600 hover:underline"
              >
                Resend verification
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Display name</label>
          <input
            type="text"
            defaultValue={user.name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {saveMsg && <p className="text-green-600 text-sm">{saveMsg}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AuthNav component**

```tsx
// apps/web/src/components/AuthNav.tsx
'use client';

import Link from 'next/link';
import { authStore } from '@/lib/auth-store';
import { useEffect, useState } from 'react';

export function AuthNav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(authStore.isLoggedIn());
  }, []);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg">OS Interact</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/projects" className="text-gray-600 hover:text-gray-900">Explore</Link>
          {loggedIn ? (
            <Link href="/profile" className="text-brand-600 font-semibold">My Account</Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
              <Link href="/register" className="px-4 py-1.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Update root layout to include AuthNav**

Replace `apps/web/src/app/layout.tsx`:

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AuthNav } from '@/components/AuthNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OS Interact — Crowdfunding',
  description: 'Fund the future. Back innovative projects on OS Interact.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/profile/ apps/web/src/components/ apps/web/src/app/layout.tsx
git commit -m "feat(web): add profile page, AuthNav, and root layout header

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 15: Verify Full TypeScript Build

- [ ] **Step 1: Run full monorepo build check**

```bash
cd /path/to/OS-interactrepomain
pnpm tsc -b --noEmit 2>&1 || true
```

Expected: any remaining type errors surface (fix as needed).

- [ ] **Step 2: Fix any remaining import issues**

Common issues:
- `@/` path alias may need `tsconfig.json` paths entry in `apps/web/tsconfig.json`. Verify it contains:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
- If missing, add it and re-run tsc.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(auth): complete user authentication and account management (OSI-3)

- OAuth Google/GitHub strategies via Passport
- Email verification with signed JWTs and Nodemailer
- Frontend: login, register, OAuth callback, email verify, profile pages
- AuthNav header component

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```
