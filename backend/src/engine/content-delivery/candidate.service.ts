import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryCandidate } from './types';
import { DifficultyCalculator } from './difficulty-calculator.service';

export interface CandidateOptions {
  lessonId?: string;
  moduleId?: string;
  prioritizedSkills?: string[];
}

@Injectable()
export class CandidateService {
  constructor(
    private prisma: PrismaService,
    private difficultyCalculator: DifficultyCalculator,
  ) {}

  async getReviewCandidates(
    userId: string,
    options: CandidateOptions = {},
  ): Promise<DeliveryCandidate[]> {
    const { lessonId, moduleId } = options;
    const now = new Date();
    const candidates: DeliveryCandidate[] = [];

    const questionWhere: {
      userId: string;
      nextReviewDue: { lte: Date; not: null };
      questionId?: { in: string[] };
    } = {
      userId,
      nextReviewDue: {
        lte: now,
        not: null,
      },
    };

    if (lessonId) {
      const lessonQuestions = await this.prisma.question.findMany({
        where: {
          teaching: { lessonId },
        },
        select: { id: true },
      });
      const questionIds = lessonQuestions.map((q) => q.id);
      if (questionIds.length === 0) {
        return [];
      }
      questionWhere.questionId = { in: questionIds };
    } else if (moduleId) {
      const moduleQuestions = await this.prisma.question.findMany({
        where: {
          teaching: {
            lesson: { moduleId },
          },
        },
        select: { id: true },
      });
      const questionIds = moduleQuestions.map((q) => q.id);
      if (questionIds.length === 0) {
        return [];
      }
      questionWhere.questionId = { in: questionIds };
    }

    let allDuePerformances: Awaited<
      ReturnType<typeof this.prisma.userQuestionPerformance.findMany>
    >;
    try {
      allDuePerformances =
        await this.prisma.userQuestionPerformance.findMany({
          where: questionWhere,
          orderBy: { createdAt: 'desc' },
        });
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (
        err?.message?.includes('column') ||
        err?.message?.includes('does not exist') ||
        err?.message?.includes('not available')
      ) {
        return [];
      }
      throw error;
    }

    const questionIdMap = new Map<string, (typeof allDuePerformances)[0]>();
    for (const perf of allDuePerformances) {
      const existing = questionIdMap.get(perf.questionId);
      if (!existing || perf.createdAt > existing.createdAt) {
        questionIdMap.set(perf.questionId, perf);
      }
    }

    for (const perf of Array.from(questionIdMap.values())) {
      const question = await this.prisma.question.findUnique({
        where: { id: perf.questionId },
        include: {
          variants: {
            select: {
              deliveryMethod: true,
            },
          },
          skillTags: {
            select: {
              name: true,
            },
          },
          teaching: {
            include: {
              lesson: true,
              skillTags: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (question) {
        const availableMethods: DELIVERY_METHOD[] =
          question.variants?.map((v) => v.deliveryMethod) ?? [];
        const recentAttempts =
          await this.prisma.userQuestionPerformance.findMany({
            where: {
              userId,
              questionId: perf.questionId,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

        const errorScore = recentAttempts.filter((a) => a.score < 80).length;
        const lastSeen =
          recentAttempts[0]?.createdAt || perf.nextReviewDue || now;
        const timeSinceLastSeen = Date.now() - lastSeen.getTime();
        const dueScore = this.calculateDueScore(perf.nextReviewDue || now, now);

        const recentScores = recentAttempts.map((a) => a.score);
        const avgScore =
          recentScores.length > 0
            ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
            : 50;
        const estimatedMastery = avgScore / 100;

        const questionTags = this.extractSkillTags(question);
        const teachingTags = this.extractSkillTags(question.teaching);
        const skillTags = Array.from(
          new Set([...questionTags, ...teachingTags]),
        );

        const exerciseType = this.determineExerciseType(
          availableMethods,
          question.teaching,
        );

        const baseDifficulty =
          this.difficultyCalculator.calculateBaseDifficulty(
            question.teaching.knowledgeLevel,
          );
        const difficulty =
          this.difficultyCalculator.adjustDifficultyForMastery(
            baseDifficulty,
            estimatedMastery,
          );

        candidates.push({
          kind: 'question',
          id: question.id,
          questionId: question.id,
          teachingId: question.teachingId,
          lessonId: question.teaching.lessonId,
          dueScore,
          errorScore,
          timeSinceLastSeen,
          deliveryMethods: availableMethods,
          skillTags,
          exerciseType,
          difficulty,
          estimatedMastery,
        });
      }
    }

    return candidates;
  }

  async getNewCandidates(
    userId: string,
    options: CandidateOptions = {},
  ): Promise<DeliveryCandidate[]> {
    const { lessonId, moduleId } = options;
    const candidates: DeliveryCandidate[] = [];

    const whereClause: {
      teaching?: { lessonId: string } | { lesson: { moduleId: string } };
    } = {};
    if (lessonId) {
      whereClause.teaching = { lessonId };
    } else if (moduleId) {
      whereClause.teaching = { lesson: { moduleId } };
    }

    const allQuestions = await this.prisma.question.findMany({
      where: whereClause,
      include: {
        variants: {
          select: {
            deliveryMethod: true,
          },
        },
        skillTags: {
          select: {
            name: true,
          },
        },
        teaching: {
          include: {
            lesson: true,
            skillTags: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const attemptedQuestionIds =
      await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: { questionId: true },
        distinct: ['questionId'],
      });
    const attemptedSet = new Set(attemptedQuestionIds.map((a) => a.questionId));

    for (const question of allQuestions) {
      if (!attemptedSet.has(question.id)) {
        const questionTags = this.extractSkillTags(question);
        const teachingTags = this.extractSkillTags(question.teaching);
        const skillTags = Array.from(
          new Set([...questionTags, ...teachingTags]),
        );

        const availableMethods: DELIVERY_METHOD[] =
          question.variants?.map((v) => v.deliveryMethod) ?? [];

        const exerciseType = this.determineExerciseType(
          availableMethods,
          question.teaching,
        );

        const difficulty =
          this.difficultyCalculator.calculateBaseDifficulty(
            question.teaching.knowledgeLevel,
          );

        candidates.push({
          kind: 'question',
          id: question.id,
          questionId: question.id,
          teachingId: question.teachingId,
          lessonId: question.teaching.lessonId,
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: Infinity,
          deliveryMethods: availableMethods,
          skillTags,
          exerciseType,
          difficulty,
          estimatedMastery: 0,
        });
      }
    }

    return candidates;
  }

  extractSkillTags(item: { skillTags?: Array<{ name: string }> }): string[] {
    if (item.skillTags && Array.isArray(item.skillTags)) {
      return item.skillTags
        .map((tag) => tag.name)
        .filter((name) => name);
    }
    return [];
  }

  private determineExerciseType(
    deliveryMethods: DELIVERY_METHOD[],
    teaching: { tip?: string | null },
  ): string {
    if (
      deliveryMethods.includes(DELIVERY_METHOD.SPEECH_TO_TEXT) ||
      deliveryMethods.includes(DELIVERY_METHOD.TEXT_TO_SPEECH)
    ) {
      return 'speaking';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.TEXT_TRANSLATION)) {
      return 'translation';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.FILL_BLANK)) {
      return 'grammar';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.MULTIPLE_CHOICE)) {
      return 'vocabulary';
    }
    if (deliveryMethods.includes(DELIVERY_METHOD.FLASHCARD)) {
      return 'vocabulary';
    }

    if (teaching.tip) {
      const tipLower = teaching.tip.toLowerCase();
      if (tipLower.includes('grammar') || tipLower.includes('rule')) {
        return 'grammar';
      }
      if (tipLower.includes('vocabulary') || tipLower.includes('word')) {
        return 'vocabulary';
      }
    }

    return 'practice';
  }

  private calculateDueScore(dueAt: Date, now: Date): number {
    const overdueMs = now.getTime() - dueAt.getTime();
    return Math.max(0, overdueMs / (1000 * 60 * 60));
  }
}
