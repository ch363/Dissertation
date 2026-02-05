import { Injectable, NotFoundException } from '@nestjs/common';
import { Lesson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';
import {
  moduleInclude,
  lessonTeachingsInclude,
} from '../common/prisma/selects';

@Injectable()
export class LessonsService extends BaseCrudService<Lesson> {
  constructor(prisma: PrismaService) {
    super(prisma, 'lesson', 'Lesson');
  }

  async findAll(moduleId?: string) {
    const where = moduleId ? { moduleId } : {};
    return this.prisma.lesson.findMany({
      where,
      include: moduleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return super.findOne(id, {
      include: moduleInclude,
    });
  }

  async findTeachings(lessonId: string) {
    const lesson = await this.findOrThrow(lessonId, lessonTeachingsInclude);

    return (lesson as any).teachings;
  }

  async findRecommended(userId?: string) {
    const lessons = await this.prisma.lesson.findMany({
      include: {
        ...moduleInclude,
        teachings: {
          select: {
            id: true,
            knowledgeLevel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { knowledgeLevel: true },
      });

      if (user?.knowledgeLevel) {
        lessons.sort((a, b) => {
          const aMatches = a.teachings.filter(
            (t) => t.knowledgeLevel === user.knowledgeLevel,
          ).length;
          const bMatches = b.teachings.filter(
            (t) => t.knowledgeLevel === user.knowledgeLevel,
          ).length;
          return bMatches - aMatches;
        });
      }
    }

    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      imageUrl: lesson.imageUrl,
      module: lesson.module,
      numberOfItems: lesson.numberOfItems,
      teachingCount: lesson.teachings.length,
    }));
  }
}
