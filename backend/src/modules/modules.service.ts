import { Injectable, NotFoundException } from '@nestjs/common';
import { Module, Prisma } from '@prisma/client';
import { ModuleRepository } from './modules.repository';
import { BaseCrudService } from '../common/services';

/**
 * ModulesService
 *
 * Business logic layer for Module operations.
 * Extends BaseCrudService for standard CRUD operations (DRY principle).
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class ModulesService extends BaseCrudService<
  Module,
  Prisma.ModuleCreateInput,
  Prisma.ModuleUpdateInput
> {
  constructor(private readonly moduleRepository: ModuleRepository) {
    super(moduleRepository, 'Module');
  }

  /**
   * Find all modules (overrides base to use ordered query).
   */
  async findAll(): Promise<Module[]> {
    return this.moduleRepository.findAllOrdered();
  }

  /**
   * Find a module by ID or slug (overrides base findOne).
   * Supports both UUID and slug lookup.
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
   * Find lessons for a module (custom method).
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
   * Find featured modules (custom method).
   */
  async findFeatured(): Promise<Module[]> {
    return this.moduleRepository.findFeatured(5);
  }
}
