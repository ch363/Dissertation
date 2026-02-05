import { Injectable, NotFoundException } from '@nestjs/common';
import { Module } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCrudService } from '../common/services/base-crud.service';
import { isValidUuid } from '../common/utils/sanitize.util';
import { normalizeTitle } from '../common/utils/string.util';

@Injectable()
export class ModulesService extends BaseCrudService<Module> {
  constructor(prisma: PrismaService) {
    super(prisma, 'module', 'Module');
  }

  async findAll() {
    return this.prisma.module.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Helper method to find a module by ID or slug
   */
  private async findModuleByIdOrSlug(
    idOrSlug: string,
    include?: any,
  ): Promise<Module | null> {
    const uuidCheck = isValidUuid(idOrSlug);

    if (uuidCheck) {
      return this.prisma.module.findUnique({
        where: { id: idOrSlug },
        ...(include && { include }),
      });
    }

    const normalizedTitle = normalizeTitle(idOrSlug);
    const modules = await this.prisma.module.findMany({
      where: {
        title: {
          equals: normalizedTitle,
          mode: 'insensitive',
        },
      },
      ...(include && { include }),
    });

    return modules.length > 0 ? modules[0] : null;
  }

  async findOne(idOrSlug: string) {
    const module = await this.findModuleByIdOrSlug(idOrSlug);

    if (!module) {
      throw new NotFoundException(
        `Module with ID or slug '${idOrSlug}' not found`,
      );
    }

    return module;
  }

  async findLessons(moduleIdOrSlug: string) {
    const module = await this.findModuleByIdOrSlug(moduleIdOrSlug, {
      lessons: {
        orderBy: { createdAt: 'asc' },
      },
    });

    if (!module) {
      throw new NotFoundException(
        `Module with ID or title '${moduleIdOrSlug}' not found`,
      );
    }

    return (module as any).lessons;
  }

  async findFeatured() {
    return this.prisma.module.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}
