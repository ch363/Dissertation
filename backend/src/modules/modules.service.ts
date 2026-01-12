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

  async findLessons(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return module.lessons;
  }
}
