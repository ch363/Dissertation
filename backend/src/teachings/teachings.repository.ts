import { Injectable } from '@nestjs/common';
import { Teaching, Prisma, Lesson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRepository } from '../common/repositories';
import {
  lessonInclude,
  teachingQuestionsInclude,
} from '../common/prisma/selects';

/**
 * Teaching with skill tags relation included.
 */
export type TeachingWithSkillTags = Teaching & {
  skillTags: { name: string }[];
  lesson?: Lesson;
};

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

  /**
   * Find a teaching by ID with skill tags included.
   * Used by ContentDataService for engine operations.
   */
  async findByIdWithSkillTags(id: string): Promise<Teaching | null> {
    return this.getModel().findUnique({
      where: { id },
      include: {
        skillTags: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find teachings with flexible filters.
   * Used by ContentDataService for candidate selection.
   * Returns teachings with skillTags included.
   */
  async findManyWithFilters(options: {
    ids?: string[];
    lessonId?: string;
    moduleId?: string;
  }): Promise<TeachingWithSkillTags[]> {
    const whereClause: any = {};

    if (options.ids && options.ids.length > 0) {
      whereClause.id = { in: options.ids };
    }

    if (options.lessonId) {
      whereClause.lessonId = options.lessonId;
    } else if (options.moduleId) {
      whereClause.lesson = { moduleId: options.moduleId };
    }

    return this.getModel().findMany({
      where: whereClause,
      include: {
        lesson: true,
        skillTags: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find a teaching by ID with lessonId and question IDs.
   * Used by LessonProgressService for marking completions.
   */
  async findByIdWithQuestionIds(
    id: string,
  ): Promise<{ id: string; lessonId: string | null; questions: { id: string }[] } | null> {
    return this.getModel().findUnique({
      where: { id },
      select: {
        id: true,
        lessonId: true,
        questions: {
          select: { id: true },
        },
      },
    });
  }
}
