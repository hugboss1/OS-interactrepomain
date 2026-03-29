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
      callbackURL: config.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3001/v1/auth/github/callback',
      ),
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
