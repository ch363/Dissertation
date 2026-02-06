import { Injectable, NotFoundException } from '@nestjs/common';
import { Teaching } from '@prisma/client';
import { TeachingRepository } from './teachings.repository';
import { BaseCrudService } from '../common/services/base-crud.service';

/**
 * TeachingsService
 *
 * Business logic layer for Teaching operations.
 * Extends BaseCrudService for standard CRUD (DRY principle).
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class TeachingsService extends BaseCrudService<Teaching> {
  constructor(private readonly teachingRepository: TeachingRepository) {
    // Cast required because Prisma's create input types include relation fields
    // that aren't present in the entity type
    super(teachingRepository as any, 'Teaching');
  }

  /**
   * Find all teachings, optionally filtered by lesson.
   */
  async findAllByLesson(lessonId?: string): Promise<Teaching[]> {
    return this.teachingRepository.findAllWithLesson(lessonId);
  }

  /**
   * Find a teaching by ID with lesson info.
   * Overrides base findOne for richer data.
   */
  override async findOne(id: string): Promise<Teaching> {
    const teaching = await this.teachingRepository.findByIdWithLesson(id);
    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }
    return teaching;
  }

  /**
   * Find questions for a teaching.
   */
  async findQuestions(teachingId: string): Promise<any[]> {
    await this.teachingRepository.findByIdOrThrow(teachingId, 'Teaching');
    return this.teachingRepository.findQuestions(teachingId);
  }
}
