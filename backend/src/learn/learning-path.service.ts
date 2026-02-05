import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningPathCardDto } from './learning-path.dto';
import { LoggerService } from '../common/logger';

/** Default flag emoji for Italian language */
const DEFAULT_FLAG_EMOJI = '🇮🇹';

/**
 * LearningPathService
 *
 * Handles learning path generation for users.
 * Follows Single Responsibility Principle - focused on learning path logic.
 */
@Injectable()
export class LearningPathService {
  private readonly logger = new LoggerService(LearningPathService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get the learning path for a user.
   * Returns modules with progress information formatted as cards.
   */
  async getLearningPath(userId: string): Promise<LearningPathCardDto[]> {
    const [user, modules] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { knowledgeLevel: true },
      }),
      this.prisma.module.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          lessons: {
            select: {
              id: true,
              _count: { select: { teachings: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    const level = String(user?.knowledgeLevel ?? 'A1');
    const flag = DEFAULT_FLAG_EMOJI;

    // Get user lesson progress
    const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const userLessons = allLessonIds.length
      ? await this.prisma.userLesson.findMany({
          where: {
            userId,
            lessonId: { in: allLessonIds },
          },
          select: {
            lessonId: true,
            completedTeachings: true,
          },
        })
      : [];

    const completedTeachingsByLessonId = new Map<string, number>();
    userLessons.forEach((ul) =>
      completedTeachingsByLessonId.set(ul.lessonId, ul.completedTeachings),
    );

    // Build learning path cards
    return modules.map((m) => {
      const total = m.lessons.length;
      let completed = 0;

      for (const lesson of m.lessons) {
        const teachingsCount = lesson._count.teachings;
        const completedTeachings =
          completedTeachingsByLessonId.get(lesson.id) ?? 0;
        if (teachingsCount > 0 && completedTeachings >= teachingsCount) {
          completed++;
        }
      }

      const subtitle =
        m.description && m.description.trim().length > 0
          ? m.description.trim()
          : `${total} ${total === 1 ? 'lesson' : 'lessons'}`;

      const cta =
        total > 0 && completed === total
          ? 'Review'
          : completed > 0
            ? 'Continue'
            : 'Start';

      return {
        id: m.id,
        title: m.title,
        subtitle,
        level,
        flag,
        completed,
        total,
        status: 'active' as const,
        cta,
      };
    });
  }

  /**
   * Get user's knowledge level.
   */
  async getUserKnowledgeLevel(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgeLevel: true },
    });
    return user?.knowledgeLevel ?? 'A1';
  }

  /**
   * Get module progress for a specific module.
   */
  async getModuleProgress(
    userId: string,
    moduleId: string,
  ): Promise<{ completed: number; total: number }> {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        lessons: {
          select: {
            id: true,
            _count: { select: { teachings: true } },
          },
        },
      },
    });

    if (!module) {
      return { completed: 0, total: 0 };
    }

    const lessonIds = module.lessons.map((l) => l.id);
    const userLessons = await this.prisma.userLesson.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
      select: {
        lessonId: true,
        completedTeachings: true,
      },
    });

    const completedMap = new Map(
      userLessons.map((ul) => [ul.lessonId, ul.completedTeachings]),
    );

    let completed = 0;
    for (const lesson of module.lessons) {
      const teachingsCount = lesson._count.teachings;
      const completedTeachings = completedMap.get(lesson.id) ?? 0;
      if (teachingsCount > 0 && completedTeachings >= teachingsCount) {
        completed++;
      }
    }

    return { completed, total: module.lessons.length };
  }
}
