import { Injectable, NotFoundException } from '@nestjs/common';
import { Lesson } from '@prisma/client';
import { LessonRepository } from './lessons.repository';
import { BaseCrudService } from '../common/services/base-crud.service';
import { UsersService } from '../users/users.service';

/**
 * LessonsService
 *
 * Business logic layer for Lesson operations.
 * Extends BaseCrudService for standard CRUD (DRY principle).
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class LessonsService extends BaseCrudService<Lesson> {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly usersService: UsersService,
  ) {
    // Cast required because Prisma's create input types include relation fields
    // that aren't present in the entity type
    super(lessonRepository as any, 'Lesson');
  }

  /**
   * Find all lessons, optionally filtered by module.
   */
  async findAllByModule(moduleId?: string): Promise<Lesson[]> {
    return this.lessonRepository.findAllWithModule(moduleId);
  }

  /**
   * Find a lesson by ID with module info.
   * Overrides base findOne for richer data.
   */
  override async findOne(id: string): Promise<Lesson> {
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
    await this.lessonRepository.findByIdOrThrow(lessonId, 'Lesson');
    return this.lessonRepository.findTeachings(lessonId);
  }

  /**
   * Find recommended lessons for a user.
   * Sorts by relevance to user's knowledge level.
   */
  async findRecommended(userId?: string): Promise<any[]> {
    const lessons = await this.lessonRepository.findRecommended(10);

    if (userId) {
      const user = await this.usersService.findOne(userId);

      if (user?.knowledgeLevel) {
        lessons.sort((a: any, b: any) => {
          const aMatches =
            a.teachings?.filter(
              (t: any) => t.knowledgeLevel === user.knowledgeLevel,
            ).length ?? 0;
          const bMatches =
            b.teachings?.filter(
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
}
