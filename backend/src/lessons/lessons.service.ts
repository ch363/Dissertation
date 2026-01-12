import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(moduleId?: string) {
    const where = moduleId ? { moduleId } : {};
    return this.prisma.lesson.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async create(createDto: CreateLessonDto) {
    // TODO: Add admin check
    return this.prisma.lesson.create({
      data: createDto,
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateLessonDto) {
    // TODO: Add admin check
    try {
      return await this.prisma.lesson.update({
        where: { id },
        data: updateDto,
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    // TODO: Add admin check
    // Cascade delete is handled by Prisma schema
    try {
      return await this.prisma.lesson.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
  }

  async findTeachings(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teachings: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson.teachings;
  }
}
