import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Lesson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LessonRepository } from './lessons.repository';
import { LoggerService } from '../common/logger';

/**
 * LessonsService
 *
 * Business logic layer for Lesson operations.
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class LessonsService {
  private readonly logger = new LoggerService(LessonsService.name);

  constructor(
    @Inject('ILessonRepository')
    private readonly lessonRepository: LessonRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Find all lessons, optionally filtered by module.
   */
  async findAll(moduleId?: string): Promise<Lesson[]> {
    return this.lessonRepository.findAllWithModule(moduleId);
  }

  /**
   * Find a lesson by ID.
   */
  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findByIdWithModule(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return lesson;
  }

  /**
   * Find teachings for a lesson.
   */
  async findTeachings(lessonId: string): Promise<any[]> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }
    return this.lessonRepository.findTeachings(lessonId);
  }

  /**
   * Find recommended lessons for a user.
   */
  async findRecommended(userId?: string): Promise<any[]> {
    const lessons = await this.lessonRepository.findRecommended(10);

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { knowledgeLevel: true },
      });

      if (user?.knowledgeLevel) {
        lessons.sort((a: any, b: any) => {
          const aMatches = a.teachings?.filter(
            (t: any) => t.knowledgeLevel === user.knowledgeLevel,
          ).length ?? 0;
          const bMatches = b.teachings?.filter(
            (t: any) => t.knowledgeLevel === user.knowledgeLevel,
          ).length ?? 0;
          return bMatches - aMatches;
        });
      }
    }

    return lessons.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      imageUrl: lesson.imageUrl,
      module: lesson.module,
      numberOfItems: lesson.numberOfItems,
      teachingCount: lesson.teachings?.length ?? 0,
    }));
  }

  /**
   * Create a new lesson.
   */
  async create(data: any): Promise<Lesson> {
    return this.lessonRepository.create(data);
  }

  /**
   * Update a lesson.
   */
  async update(id: string, data: any): Promise<Lesson> {
    return this.lessonRepository.update(id, data);
  }

  /**
   * Delete a lesson.
   */
  async remove(id: string): Promise<void> {
    await this.lessonRepository.delete(id);
  }

  /**
   * Count lessons.
   */
  async count(where?: any): Promise<number> {
    return this.lessonRepository.count(where);
  }
}
