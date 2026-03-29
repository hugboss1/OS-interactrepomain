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

  create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({ data });
  }

  update(id: string, data: { name?: string; avatarUrl?: string }) {
    return prisma.user.update({ where: { id }, data });
  }
}
