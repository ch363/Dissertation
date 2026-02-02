import { Injectable, NotFoundException } from '@nestjs/common';
import { Lesson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';

@Injectable()
export class LessonsService extends BaseCrudService<Lesson> {
  constructor(prisma: PrismaService) {
    super(prisma, 'lesson', 'Lesson');
  }

  async findAll(moduleId?: string) {
    const where = moduleId ? { moduleId } : {};
    return this.prisma.lesson.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async findTeachings(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teachings: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson.teachings;
  }

  async findRecommended(userId?: string) {
    const lessons = await this.prisma.lesson.findMany({
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
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
