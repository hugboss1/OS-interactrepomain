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
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3001/v1/auth/google/callback',
      ),
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
    const name = profile.displayName ?? 'Google User';
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
