import { Injectable } from '@nestjs/common';
import { Teaching, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRepository } from '../common/repositories';
import {
  lessonInclude,
  teachingQuestionsInclude,
} from '../common/prisma/selects';

/**
 * TeachingRepository
 *
 * Data access layer for Teaching entities.
 * Extends PrismaRepository to provide CRUD operations
 * and adds domain-specific query methods.
 */
@Injectable()
export class TeachingRepository extends PrismaRepository<
  Teaching,
  Prisma.TeachingCreateInput,
  Prisma.TeachingUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'teaching');
  }

  /**
   * Find all teachings, optionally filtered by lesson.
   */
  async findAllWithLesson(lessonId?: string): Promise<Teaching[]> {
    const where = lessonId ? { lessonId } : {};
    return this.getModel().findMany({
      where,
      include: lessonInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find a teaching by ID with lesson included.
   */
  async findByIdWithLesson(id: string): Promise<Teaching | null> {
    return this.getModel().findUnique({
      where: { id },
      include: lessonInclude,
    });
  }

  /**
   * Find questions for a teaching.
   */
  async findQuestions(teachingId: string): Promise<any[]> {
    const teaching = await this.getModel().findUnique({
      where: { id: teachingId },
      include: teachingQuestionsInclude,
    });
    return teaching?.questions ?? [];
  }

  /**
   * Find teachings by lesson ID.
   */
  async findByLessonId(lessonId: string): Promise<Teaching[]> {
    return this.findAll({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find teachings by knowledge level.
   */
  async findByKnowledgeLevel(level: string): Promise<Teaching[]> {
    return this.findAll({
      where: { knowledgeLevel: level },
      orderBy: { createdAt: 'asc' },
    });
  }
}
