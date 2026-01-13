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

  async findRecommended(userId?: string) {
    // Return recommended lessons
    // Algorithm: lessons with teachings matching user's knowledge level, or most popular
    // For now, return lessons with most teachings (as a proxy for popularity/completeness)
    const lessons = await this.prisma.lesson.findMany({
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
        teachings: {
          select: {
            id: true,
            knowledgeLevel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // If userId provided, prioritize lessons matching user's knowledge level
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { knowledgeLevel: true },
      });

      if (user?.knowledgeLevel) {
        // Sort by number of teachings matching user's level
        lessons.sort((a, b) => {
          const aMatches = a.teachings.filter((t) => t.knowledgeLevel === user.knowledgeLevel).length;
          const bMatches = b.teachings.filter((t) => t.knowledgeLevel === user.knowledgeLevel).length;
          return bMatches - aMatches;
        });
      }
    }

    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      imageUrl: lesson.imageUrl,
      module: lesson.module,
      numberOfItems: lesson.numberOfItems,
      teachingCount: lesson.teachings.length,
    }));
  }
}
