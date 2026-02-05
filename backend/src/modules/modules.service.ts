import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Module } from '@prisma/client';
import { ModuleRepository } from './modules.repository';
import { LoggerService } from '../common/logger';

/**
 * ModulesService
 *
 * Business logic layer for Module operations.
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class ModulesService {
  private readonly logger = new LoggerService(ModulesService.name);

  constructor(
    @Inject('IModuleRepository')
    private readonly moduleRepository: ModuleRepository,
  ) {}

  /**
   * Find all modules.
   */
  async findAll(): Promise<Module[]> {
    return this.moduleRepository.findAllOrdered();
  }

  /**
   * Find a module by ID or slug.
   */
  async findOne(idOrSlug: string): Promise<Module> {
    const module = await this.moduleRepository.findByIdOrSlug(idOrSlug);

    if (!module) {
      throw new NotFoundException(
        `Module with ID or slug '${idOrSlug}' not found`,
      );
    }

    return module;
  }

  /**
   * Find lessons for a module.
   */
  async findLessons(moduleIdOrSlug: string): Promise<any[]> {
    const module =
      await this.moduleRepository.findByIdOrSlugWithLessons(moduleIdOrSlug);

    if (!module) {
      throw new NotFoundException(
        `Module with ID or title '${moduleIdOrSlug}' not found`,
      );
    }

    return (module as any).lessons ?? [];
  }

  /**
   * Find featured modules.
   */
  async findFeatured(): Promise<Module[]> {
    return this.moduleRepository.findFeatured(5);
  }

  /**
   * Create a new module.
   */
  async create(data: any): Promise<Module> {
    return this.moduleRepository.create(data);
  }

  /**
   * Update a module.
   */
  async update(id: string, data: any): Promise<Module> {
    return this.moduleRepository.update(id, data);
  }

  /**
   * Delete a module.
   */
  async remove(id: string): Promise<void> {
    await this.moduleRepository.delete(id);
  }

  /**
   * Count modules.
   */
  async count(where?: any): Promise<number> {
    return this.moduleRepository.count(where);
  }
}
