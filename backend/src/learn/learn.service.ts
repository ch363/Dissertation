import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentDeliveryService } from '../engine/content-delivery/content-delivery.service';
import { SessionPlanDto, SessionContext } from '../engine/content-delivery/session-types';
import { ProgressService } from '../progress/progress.service';
import { LearningPathCardDto } from './learning-path.dto';

@Injectable()
export class LearnService {
  constructor(
    private prisma: PrismaService,
    private contentDelivery: ContentDeliveryService,
    private progressService: ProgressService,
  ) {}

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
    const flag = '🇮🇹';

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
        status: 'active',
        cta,
      };
    });
  }

  async getSuggestions(
    userId: string,
    currentLessonId?: string,
    moduleId?: string,
    limit: number = 3,
  ) {
    const completedTeachings = await this.prisma.userTeachingCompleted.findMany(
      {
        where: { userId },
        select: { teachingId: true },
      },
    );

    const completedTeachingIds = new Set(
      completedTeachings.map((ct) => ct.teachingId),
    );

    const startedLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      select: { lessonId: true },
    });

    const startedLessonIds = new Set(startedLessons.map((sl) => sl.lessonId));

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgeLevel: true },
    });

    const userKnowledgeLevel = user?.knowledgeLevel;

    const suggestedLessons: Array<{
      lesson: any;
      module: any;
      reason: string;
    }> = [];

    const suggestedModules: Array<{
      module: any;
      reason: string;
    }> = [];

    if (currentLessonId) {
      const currentLesson = await this.prisma.lesson.findUnique({
        where: { id: currentLessonId },
        include: {
          module: {
            include: {
              lessons: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (
        currentLesson &&
        (!moduleId || currentLesson.module.id === moduleId)
      ) {
        const moduleLessons = currentLesson.module.lessons;
        const currentIndex = moduleLessons.findIndex(
          (l) => l.id === currentLessonId,
        );
        const nextLesson = moduleLessons[currentIndex + 1];

        if (nextLesson && !startedLessonIds.has(nextLesson.id)) {
          suggestedLessons.push({
            lesson: {
              id: nextLesson.id,
              title: nextLesson.title,
              imageUrl: nextLesson.imageUrl,
            },
            module: {
              id: currentLesson.module.id,
              title: currentLesson.module.title,
            },
            reason: 'Next lesson in current module',
          });
        }
      }
    }

    if (userKnowledgeLevel) {
      const alignedLessons = await this.prisma.lesson.findMany({
        where: {
          ...(moduleId ? { moduleId } : {}),
          teachings: {
            some: {
              knowledgeLevel: userKnowledgeLevel,
            },
          },
          id: {
            notIn: Array.from(startedLessonIds),
          },
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        take: limit - suggestedLessons.length,
        orderBy: { createdAt: 'asc' },
      });

      alignedLessons.forEach((lesson) => {
        if (suggestedLessons.length < limit) {
          suggestedLessons.push({
            lesson: {
              id: lesson.id,
              title: lesson.title,
              imageUrl: lesson.imageUrl,
            },
            module: lesson.module,
            reason: `Matches your ${userKnowledgeLevel} level`,
          });
        }
      });
    }

    const allModules = await this.prisma.module.findMany({
      include: {
        lessons: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    allModules.forEach((module) => {
      const allLessonIds = module.lessons.map((l) => l.id);
      const allStarted = allLessonIds.every((lid) => startedLessonIds.has(lid));

      if (!allStarted && suggestedModules.length < limit) {
        suggestedModules.push({
          module: {
            id: module.id,
            title: module.title,
            imageUrl: module.imageUrl,
          },
          reason: 'Contains new lessons',
        });
      }
    });

    return {
      lessons: suggestedLessons.slice(0, limit),
      modules: suggestedModules.slice(0, limit),
    };
  }

  async getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    return this.contentDelivery.getSessionPlan(userId, context);
  }
}
