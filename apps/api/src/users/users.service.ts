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
      where: {
        oauthProvider_oauthProviderId: {
          oauthProvider: provider,
          oauthProviderId: providerId,
        },
      },
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
