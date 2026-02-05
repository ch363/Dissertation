import { Injectable } from '@nestjs/common';
import { Lesson, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRepository } from '../common/repositories';
import {
  moduleInclude,
  lessonTeachingsInclude,
} from '../common/prisma/selects';

/**
 * LessonRepository
 *
 * Data access layer for Lesson entities.
 * Extends PrismaRepository to provide CRUD operations
 * and adds domain-specific query methods.
 */
@Injectable()
export class LessonRepository extends PrismaRepository<
  Lesson,
  Prisma.LessonCreateInput,
  Prisma.LessonUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'lesson');
  }

  /**
   * Find all lessons, optionally filtered by module.
   */
  async findAllWithModule(moduleId?: string): Promise<Lesson[]> {
    const where = moduleId ? { moduleId } : {};
    return this.getModel().findMany({
      where,
      include: moduleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a lesson by ID with module included.
   */
  async findByIdWithModule(id: string): Promise<Lesson | null> {
    return this.getModel().findUnique({
      where: { id },
      include: moduleInclude,
    });
  }

  /**
   * Find teachings for a lesson.
   */
  async findTeachings(lessonId: string): Promise<any[]> {
    const lesson = await this.getModel().findUnique({
      where: { id: lessonId },
      include: lessonTeachingsInclude,
    });
    return lesson?.teachings ?? [];
  }

  /**
   * Find recommended lessons with optional user context.
   */
  async findRecommended(limit: number = 10): Promise<Lesson[]> {
    return this.getModel().findMany({
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
      take: limit,
    });
  }

  /**
   * Find lessons by module ID.
   */
  async findByModuleId(moduleId: string): Promise<Lesson[]> {
    return this.findAll({
      where: { moduleId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
