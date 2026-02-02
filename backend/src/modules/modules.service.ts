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

  async findOne(idOrSlug: string) {
    const uuidCheck = isValidUuid(idOrSlug);

    let module;
    if (uuidCheck) {
      module = await this.prisma.module.findUnique({
        where: { id: idOrSlug },
      });
    } else {
      const normalizedTitle = normalizeTitle(idOrSlug);

      const modules = await this.prisma.module.findMany({
        where: {
          title: {
            equals: normalizedTitle,
            mode: 'insensitive',
          },
        },
      });

      if (modules.length > 0) {
        module = modules[0];
      }
    }

    if (!module) {
      throw new NotFoundException(
        `Module with ID or slug '${idOrSlug}' not found`,
      );
    }

    return module;
  }

  async findLessons(moduleIdOrSlug: string) {
    const uuidCheck = isValidUuid(moduleIdOrSlug);

    let module;
    if (uuidCheck) {
      module = await this.prisma.module.findUnique({
        where: { id: moduleIdOrSlug },
        include: {
          lessons: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } else {
      const normalizedTitle = normalizeTitle(moduleIdOrSlug);

      const modules = await this.prisma.module.findMany({
        where: {
          title: {
            equals: normalizedTitle,
            mode: 'insensitive',
          },
        },
        include: {
          lessons: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (modules.length > 0) {
        module = modules[0];
      }
    }

    if (!module) {
      throw new NotFoundException(
        `Module with ID or title '${moduleIdOrSlug}' not found`,
      );
    }

    return module.lessons;
  }

  async findFeatured() {
    return this.prisma.module.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}
