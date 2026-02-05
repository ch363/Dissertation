import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Teaching } from '@prisma/client';
import { TeachingRepository } from './teachings.repository';
import { LoggerService } from '../common/logger';

/**
 * TeachingsService
 *
 * Business logic layer for Teaching operations.
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class TeachingsService {
  private readonly logger = new LoggerService(TeachingsService.name);

  constructor(
    @Inject('ITeachingRepository')
    private readonly teachingRepository: TeachingRepository,
  ) {}

  /**
   * Find all teachings, optionally filtered by lesson.
   */
  async findAll(lessonId?: string): Promise<Teaching[]> {
    return this.teachingRepository.findAllWithLesson(lessonId);
  }

  /**
   * Find a teaching by ID.
   */
  async findOne(id: string): Promise<Teaching> {
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
    const teaching = await this.teachingRepository.findById(teachingId);
    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${teachingId} not found`);
    }
    return this.teachingRepository.findQuestions(teachingId);
  }

  /**
   * Create a new teaching.
   */
  async create(data: any): Promise<Teaching> {
    return this.teachingRepository.create(data);
  }

  /**
   * Update a teaching.
   */
  async update(id: string, data: any): Promise<Teaching> {
    return this.teachingRepository.update(id, data);
  }

  /**
   * Delete a teaching.
   */
  async remove(id: string): Promise<void> {
    await this.teachingRepository.delete(id);
  }

  /**
   * Count teachings.
   */
  async count(where?: any): Promise<number> {
    return this.teachingRepository.count(where);
  }
}
