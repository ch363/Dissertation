import { Injectable } from '@nestjs/common';
import { Module, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRepository } from '../common/repositories';
import { isValidUuid } from '../common/utils/sanitize.util';
import { normalizeTitle } from '../common/utils/string.util';
import { moduleLessonsInclude } from '../common/prisma/selects';

/**
 * ModuleRepository
 *
 * Data access layer for Module entities.
 * Extends PrismaRepository to provide CRUD operations
 * and adds domain-specific query methods.
 */
@Injectable()
export class ModuleRepository extends PrismaRepository<
  Module,
  Prisma.ModuleCreateInput,
  Prisma.ModuleUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'module');
  }

  /**
   * Find all modules ordered by creation date.
   */
  async findAllOrdered(): Promise<Module[]> {
    return this.getModel().findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a module by ID or slug (title).
   */
  async findByIdOrSlug(idOrSlug: string): Promise<Module | null> {
    const isUuid = isValidUuid(idOrSlug);

    if (isUuid) {
      return this.findById(idOrSlug);
    }

    const normalizedTitle = normalizeTitle(idOrSlug);
    const modules = await this.getModel().findMany({
      where: {
        title: {
          equals: normalizedTitle,
          mode: 'insensitive',
        },
      },
    });

    return modules.length > 0 ? modules[0] : null;
  }

  /**
   * Find a module by ID or slug with lessons included.
   */
  async findByIdOrSlugWithLessons(idOrSlug: string): Promise<Module | null> {
    const isUuid = isValidUuid(idOrSlug);

    if (isUuid) {
      return this.getModel().findUnique({
        where: { id: idOrSlug },
        include: moduleLessonsInclude,
      });
    }

    const normalizedTitle = normalizeTitle(idOrSlug);
    const modules = await this.getModel().findMany({
      where: {
        title: {
          equals: normalizedTitle,
          mode: 'insensitive',
        },
      },
      include: moduleLessonsInclude,
    });

    return modules.length > 0 ? modules[0] : null;
  }

  /**
   * Find featured modules.
   */
  async findFeatured(limit: number = 5): Promise<Module[]> {
    return this.getModel().findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Find module with lessons.
   */
  async findByIdWithLessons(id: string): Promise<Module | null> {
    return this.getModel().findUnique({
      where: { id },
      include: moduleLessonsInclude,
    });
  }
}
