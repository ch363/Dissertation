import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';

@Injectable()
export class TeachingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(lessonId?: string) {
    const where = lessonId ? { lessonId } : {};
    return this.prisma.teaching.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const teaching = await this.prisma.teaching.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }

    return teaching;
  }

  async create(createDto: CreateTeachingDto) {
    // TODO: Add admin check
    return this.prisma.teaching.create({
      data: createDto,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateTeachingDto) {
    // TODO: Add admin check
    try {
      return await this.prisma.teaching.update({
        where: { id },
        data: updateDto,
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    // TODO: Add admin check
    // Cascade delete is handled by Prisma schema
    try {
      return await this.prisma.teaching.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }
  }

  async findQuestions(teachingId: string) {
    const teaching = await this.prisma.teaching.findUnique({
      where: { id: teachingId },
      include: {
        questions: true,
      },
    });

    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${teachingId} not found`);
    }

    return teaching.questions;
  }
}
