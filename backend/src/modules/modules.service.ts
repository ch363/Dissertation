import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.module.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    return module;
  }

  async create(createDto: CreateModuleDto) {
    // TODO: Add admin check
    return this.prisma.module.create({
      data: createDto,
    });
  }

  async update(id: string, updateDto: UpdateModuleDto) {
    // TODO: Add admin check
    try {
      return await this.prisma.module.update({
        where: { id },
        data: updateDto,
      });
    } catch (error) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    // TODO: Add admin check
    // Cascade delete is handled by Prisma schema
    try {
      return await this.prisma.module.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
  }

  async findLessons(moduleIdOrSlug: string) {
    // Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleIdOrSlug);
    
    let module;
    if (isUuid) {
      // Try to find by UUID
      module = await this.prisma.module.findUnique({
        where: { id: moduleIdOrSlug },
        include: {
          lessons: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } else {
      // Try to find by title (case-insensitive)
      // Normalize: capitalize first letter to match "Basics" format
      const normalizedTitle = moduleIdOrSlug
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
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
        module = modules[0]; // Take first match
      }
    }

    if (!module) {
      throw new NotFoundException(`Module with ID or title '${moduleIdOrSlug}' not found`);
    }

    return module.lessons;
  }

  async findFeatured() {
    // Return featured modules (e.g., most recent, most popular, or manually curated)
    // For now, return most recently created modules
    return this.prisma.module.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}
