import { Injectable, NotFoundException } from '@nestjs/common';
import { Teaching } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';
import {
  lessonInclude,
  teachingQuestionsInclude,
} from '../common/prisma/selects';

@Injectable()
export class TeachingsService extends BaseCrudService<Teaching> {
  constructor(prisma: PrismaService) {
    super(prisma, 'teaching', 'Teaching');
  }

  async findAll(lessonId?: string) {
    const where = lessonId ? { lessonId } : {};
    return this.prisma.teaching.findMany({
      where,
      include: lessonInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    return super.findOne(id, {
      include: lessonInclude,
    });
  }

  async findQuestions(teachingId: string) {
    const teaching = await this.findOrThrow(
      teachingId,
      teachingQuestionsInclude,
    );

    return (teaching as any).questions;
  }
}
