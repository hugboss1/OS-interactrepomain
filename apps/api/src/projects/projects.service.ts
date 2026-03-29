import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@os-interact/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const prisma = new PrismaClient();

@Injectable()
export class ProjectsService {
  list(query: { category?: string; status?: string; search?: string }) {
    return prisma.project.findMany({
      where: {
        ...(query.category ? { category: query.category } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.project.findUnique({ where: { id } });
  }

  create(creatorId: string, dto: CreateProjectDto) {
    return prisma.project.create({
      data: { ...dto, creatorId, raisedAmount: 0, status: 'active' },
    });
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException();
    if (project.creatorId !== userId) throw new ForbiddenException();
    return prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException();
    if (project.creatorId !== userId) throw new ForbiddenException();
    return prisma.project.delete({ where: { id } });
  }
}
