import { Injectable, NotFoundException } from '@nestjs/common';
import { Teaching } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';

@Injectable()
export class TeachingsService extends BaseCrudService<Teaching> {
  constructor(prisma: PrismaService) {
    super(prisma, 'teaching', 'Teaching');
  }

  async findAll(lessonId?: string) {
    const where = lessonId ? { lessonId } : {};
    return this.prisma.teaching.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const teaching = await this.prisma.teaching.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }

    return teaching;
  }

  async findQuestions(teachingId: string) {
    const teaching = await this.prisma.teaching.findUnique({
      where: { id: teachingId },
      include: {
        questions: true,
      },
    });

    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${teachingId} not found`);
    }

    return teaching.questions;
  }
}
