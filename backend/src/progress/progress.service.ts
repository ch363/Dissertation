import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { ValidateAnswerResponseDto } from './dto/validate-answer-response.dto';
import { ValidatePronunciationDto } from './dto/validate-pronunciation.dto';
import {
  PronunciationResponseDto,
  WordAnalysisDto,
} from './dto/pronunciation-response.dto';
import { DELIVERY_METHOD, Prisma } from '@prisma/client';
import { SrsService } from '../engine/srs/srs.service';
import { XpService } from '../engine/scoring/xp.service';
import { isMissingColumnOrSchemaMismatchError } from '../common/utils/prisma-error.util';
import { getEndOfLocalDayUtc } from '../common/utils/date.util';
import { normalizeTitle } from '../common/utils/string.util';
import { isValidUuid } from '../common/utils/sanitize.util';
import { LoggerService } from '../common/logger';
import { ContentLookupService } from '../content/content-lookup.service';
import { MasteryService } from '../engine/mastery/mastery.service';
import { SessionPlanCacheService } from '../engine/content-delivery/session-plan-cache.service';
import { extractSkillTags } from '../engine/mastery/skill-extraction.util';
import { PronunciationService } from '../speech/pronunciation/pronunciation.service';
import { OnboardingPreferencesService } from '../onboarding/onboarding-preferences.service';
import { GrammarService } from '../grammar/grammar.service';

/** Delivery methods that use free-text input and get grammatical correctness. */
const GRAMMATICAL_TEXT_METHODS: DELIVERY_METHOD[] = [
  DELIVERY_METHOD.TEXT_TRANSLATION,
  DELIVERY_METHOD.FILL_BLANK,
  DELIVERY_METHOD.SPEECH_TO_TEXT,
];

/** Language code for grammar check: translation/flashcard = user answer language (e.g. en), fill-blank/speech = learning language (it). */
function getGrammarCheckLanguageCode(deliveryMethod: DELIVERY_METHOD): string {
  if (
    deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
    deliveryMethod === DELIVERY_METHOD.FLASHCARD
  ) {
    return 'en-GB'; // User types in their language (English)
  }
  return 'it'; // User types/speaks in learning language (Italian)
}

@Injectable()
export class ProgressService {
  private readonly logger = new LoggerService(ProgressService.name);

  constructor(
    private prisma: PrismaService,
    private srsService: SrsService,
    private xpService: XpService,
    private contentLookup: ContentLookupService,
    private masteryService: MasteryService,
    private sessionPlanCache: SessionPlanCacheService,
    private pronunciationService: PronunciationService,
    private onboardingPreferences: OnboardingPreferencesService,
    private grammarService: GrammarService,
  ) {}

  async startLesson(userId: string, lessonId: string) {
    const now = new Date();
    return this.prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        startedAt: now,
        updatedAt: now,
      },
      create: {
        userId,
        lessonId,
        completedTeachings: 0,
        startedAt: now,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  async endLesson(userId: string, lessonId: string) {
    const now = new Date();
    return this.prisma.userLesson.updateMany({
      where: {
        userId,
        lessonId,
      },
      data: {
        endedAt: now,
        updatedAt: now,
      },
    });
  }

  async getUserLessons(userId: string, tzOffsetMinutes?: number) {
    const userLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            module: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (userLessons.length === 0) return [];

    const lessonIds = userLessons.map((ul) => ul.lessonId);

    const teachings = await this.prisma.teaching.findMany({
      where: {
        lessonId: { in: lessonIds },
      },
      select: {
        id: true,
        lessonId: true,
        questions: {
          select: { id: true },
        },
      },
    });

    const teachingsByLessonId = new Map<
      string,
      Array<{ id: string; lessonId: string; questions: Array<{ id: string }> }>
    >();
    const teachingIdToLessonId = new Map<string, string>();
    const questionToLessonId = new Map<string, string>();

    for (const teaching of teachings) {
      teachingIdToLessonId.set(teaching.id, teaching.lessonId);
      const existing = teachingsByLessonId.get(teaching.lessonId) || [];
      existing.push(teaching);
      teachingsByLessonId.set(teaching.lessonId, existing);
      for (const q of teaching.questions) {
        questionToLessonId.set(q.id, teaching.lessonId);
      }
    }

    const teachingIds = teachings.map((t) => t.id);
    const completedRows =
      teachingIds.length > 0
        ? await this.prisma.userTeachingCompleted.findMany({
            where: {
              userId,
              teachingId: { in: teachingIds },
            },
            select: { teachingId: true },
          })
        : [];

    const completedTeachingsByLessonId = new Map<string, Set<string>>();
    for (const row of completedRows) {
      const lessonId = teachingIdToLessonId.get(row.teachingId);
      if (!lessonId) continue;
      const set =
        completedTeachingsByLessonId.get(lessonId) || new Set<string>();
      set.add(row.teachingId);
      completedTeachingsByLessonId.set(lessonId, set);
    }

    const now = new Date();
    const dueCutoff = getEndOfLocalDayUtc(now, tzOffsetMinutes);
    const questionIds = teachings.flatMap((t) => t.questions.map((q) => q.id));
    let dueReviews: Array<{ questionId: string; createdAt: Date }> = [];
    if (questionIds.length > 0) {
      try {
        dueReviews = await this.prisma.userQuestionPerformance.findMany({
          where: {
            userId,
            questionId: { in: questionIds },
            nextReviewDue: {
              lte: dueCutoff,
              not: null,
            },
          },
          orderBy: { createdAt: 'desc' },
          select: { questionId: true, createdAt: true },
        });
      } catch (error: any) {
        if (!isMissingColumnOrSchemaMismatchError(error)) {
          throw error;
        }
        dueReviews = [];
      }
    }

    const latestDueByQuestionId = new Map<string, Date>();
    for (const review of dueReviews) {
      const existing = latestDueByQuestionId.get(review.questionId);
      if (!existing || review.createdAt > existing) {
        latestDueByQuestionId.set(review.questionId, review.createdAt);
      }
    }

    const dueCountByLessonId = new Map<string, number>();
    latestDueByQuestionId.forEach((_createdAt, questionId) => {
      const lessonId = questionToLessonId.get(questionId);
      if (!lessonId) return;
      dueCountByLessonId.set(
        lessonId,
        (dueCountByLessonId.get(lessonId) || 0) + 1,
      );
    });

    return userLessons.map((ul) => {
      const teachingsInLesson = teachingsByLessonId.get(ul.lessonId) || [];
      const totalTeachings = teachingsInLesson.length;
      const completedTeachings =
        completedTeachingsByLessonId.get(ul.lessonId)?.size ?? 0;
      const dueReviewCount = dueCountByLessonId.get(ul.lessonId) || 0;

      return {
        lesson: ul.lesson,
        completedTeachings,
        totalTeachings,
        dueReviewCount,
      };
    });
  }

  async completeTeaching(
    userId: string,
    teachingId: string,
    timeSpentMs?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const teaching = await tx.teaching.findUnique({
        where: { id: teachingId },
        select: { lessonId: true },
      });

      if (!teaching) {
        throw new NotFoundException(`Teaching with ID ${teachingId} not found`);
      }

      const now = new Date();
      const startedAt =
        timeSpentMs != null && Number.isFinite(timeSpentMs) && timeSpentMs > 0
          ? new Date(now.getTime() - Math.min(timeSpentMs, 3600000))
          : null;
      const endedAt =
        timeSpentMs != null && Number.isFinite(timeSpentMs) && timeSpentMs > 0
          ? now
          : null;

      const existing = await tx.userTeachingCompleted.findUnique({
        where: {
          userId_teachingId: {
            userId,
            teachingId,
          },
        },
      });

      let wasNewlyCompleted = false;
      if (!existing) {
        await tx.userTeachingCompleted.create({
          data: {
            userId,
            teachingId,
            startedAt,
            endedAt,
          },
        });
        wasNewlyCompleted = true;
      } else if (startedAt != null && endedAt != null) {
        await tx.userTeachingCompleted.update({
          where: {
            userId_teachingId: {
              userId,
              teachingId,
            },
          },
          data: { startedAt, endedAt },
        });
      }

      if (wasNewlyCompleted) {
        await tx.userLesson.updateMany({
          where: {
            userId,
            lessonId: teaching.lessonId,
          },
          data: {
            completedTeachings: {
              increment: 1,
            },
          },
        });
      }

      const userLesson = await tx.userLesson.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: teaching.lessonId,
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (wasNewlyCompleted) {
        this.sessionPlanCache.invalidate(userId);
      }

      return {
        userLesson,
        wasNewlyCompleted,
      };
    });
  }

  async recordQuestionAttempt(
    userId: string,
    questionId: string,
    attemptDto: QuestionAttemptDto,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        teaching: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
            skillTags: {
              select: {
                name: true,
              },
            },
          },
        },
        skillTags: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const now = new Date();
    const isCorrect = attemptDto.score >= 80;

    const srsState = await this.srsService.calculateQuestionState(
      userId,
      questionId,
      {
        correct: isCorrect,
        timeMs: attemptDto.timeToComplete || 0,
        score: attemptDto.score,
      },
    );

    const performance = await this.prisma.userQuestionPerformance.create({
      data: {
        userId,
        questionId,
        deliveryMethod: attemptDto.deliveryMethod,
        score: attemptDto.score,
        timeToComplete: attemptDto.timeToComplete,
        percentageAccuracy: attemptDto.percentageAccuracy,
        attempts: attemptDto.attempts,
        lastRevisedAt: now,
        nextReviewDue: srsState.nextReviewDue,
        intervalDays: srsState.intervalDays,
        stability: srsState.stability,
        difficulty: srsState.difficulty,
        repetitions: srsState.repetitions,
      },
      include: {
        question: {
          select: {
            id: true,
            teaching: {
              select: {
                id: true,
                userLanguageString: true,
                learningLanguageString: true,
              },
            },
          },
        },
      },
    });

    try {
      const skillTags = extractSkillTags(question);
      const lowMasterySkills: string[] = [];

      for (const skillTag of skillTags) {
        const newMastery = await this.masteryService.updateMastery(
          userId,
          skillTag,
          isCorrect,
        );

        if (newMastery < 0.5) {
          lowMasterySkills.push(skillTag);
        }
      }

      if (lowMasterySkills.length > 0) {
        this.logger.logInfo(
          'User has low mastery skills',
          { userId, skills: lowMasterySkills, threshold: 0.5 },
        );
      }
    } catch (error) {
      this.logger.logError('Error updating mastery', error, { userId });
    }

    const awardedXp = await this.xpService.award(userId, {
      type: 'attempt',
      correct: isCorrect,
      timeMs: attemptDto.timeToComplete || 0,
    });

    if (awardedXp > 0) {
      try {
        await this.recordKnowledgeLevelProgress(userId, {
          value: awardedXp,
        });
      } catch (error) {
        this.logger.logError('Error recording knowledge level progress', error, { userId, xp: awardedXp });
      }
    }

    this.sessionPlanCache.invalidate(userId);

    return {
      ...performance,
      awardedXp,
    };
  }

  async getDueReviews(userId: string) {
    const now = new Date();

    return this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      include: {
        question: {
          include: {
            teaching: {
              select: {
                id: true,
                userLanguageString: true,
                learningLanguageString: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextReviewDue: 'asc',
      },
    });
  }

  /**
   * Count of questions due for review: "due" means the *latest* performance row
   * per question (by createdAt) has nextReviewDue <= dueCutoff.
   */
  async getDueReviewCount(userId: string, dueCutoff: Date = new Date()): Promise<number> {
    try {
      type Row = { count: bigint };
      const result = await this.prisma.$queryRaw<Row[]>`
        SELECT COUNT(*) AS count FROM (
          SELECT question_id, next_review_due,
                 ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at DESC) AS rn
          FROM user_question_performance
          WHERE user_id = ${userId}::uuid
        ) sub
        WHERE rn = 1 AND next_review_due IS NOT NULL AND next_review_due <= ${dueCutoff}
      `;
      return Number(result[0]?.count ?? 0);
    } catch (error: any) {
      if (isMissingColumnOrSchemaMismatchError(error)) return 0;
      throw error;
    }
  }

  /**
   * Returns due reviews where "due" means: the *latest* performance row per
   * question (by createdAt) has nextReviewDue <= now. This way, when the user
   * completes a review we create a new row with a future nextReviewDue, and
   * that question correctly disappears from the due list.
   */
  async getDueReviewsLatest(userId: string) {
    const now = new Date();

    type Row = { id: string };
    const latestDueIds = await this.prisma.$queryRaw<Row[]>`
      SELECT id FROM (
        SELECT id, question_id, next_review_due,
               ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at DESC) AS rn
        FROM user_question_performance
        WHERE user_id = ${userId}::uuid
      ) sub
      WHERE rn = 1 AND next_review_due IS NOT NULL AND next_review_due <= ${now}
    `;
    const ids = latestDueIds.map((r) => r.id);
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.userQuestionPerformance.findMany({
      where: { id: { in: ids } },
      include: {
        question: {
          include: {
            teaching: {
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    module: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nextReviewDue: 'asc',
      },
    });
  }

  async updateDeliveryMethodScore(
    userId: string,
    method: DELIVERY_METHOD,
    scoreDto: DeliveryMethodScoreDto,
  ) {
    const existing = await this.prisma.userDeliveryMethodScore.findUnique({
      where: {
        userId_deliveryMethod: {
          userId,
          deliveryMethod: method,
        },
      },
    });

    const currentScore = existing?.score || 0;
    const newScore = Math.max(0, Math.min(1, currentScore + scoreDto.delta));

    return this.prisma.userDeliveryMethodScore.upsert({
      where: {
        userId_deliveryMethod: {
          userId,
          deliveryMethod: method,
        },
      },
      update: {
        score: newScore,
      },
      create: {
        userId,
        deliveryMethod: method,
        score: newScore,
      },
    });
  }

  async recordKnowledgeLevelProgress(
    userId: string,
    progressDto: KnowledgeLevelProgressDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const progressRow = await tx.userKnowledgeLevelProgress.create({
        data: {
          userId,
          value: progressDto.value,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          knowledgePoints: {
            increment: progressDto.value,
          },
        },
      });

      return {
        knowledgePoints: updatedUser.knowledgePoints,
        lastProgressRow: progressRow,
      };
    });
  }

  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userLesson.deleteMany({ where: { userId } });
      await tx.userTeachingCompleted.deleteMany({ where: { userId } });
      await tx.userQuestionPerformance.deleteMany({ where: { userId } });

      if (options?.includeXp) {
        await tx.userKnowledgeLevelProgress.deleteMany({ where: { userId } });
        await tx.user.update({
          where: { id: userId },
          data: {
            knowledgePoints: 0,
            knowledgeLevel: 'A1',
          },
        });
      }

      if (options?.includeDeliveryMethodScores) {
        await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });
      }

      return {
        message: 'All progress reset successfully',
        resetXp: options?.includeXp || false,
        resetDeliveryMethodScores:
          options?.includeDeliveryMethodScores || false,
      };
    });
  }

  async resetLessonProgress(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teachings: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const questionIds = lesson.teachings.flatMap((t) =>
      t.questions.map((q) => q.id),
    );
    const teachingIds = lesson.teachings.map((t) => t.id);

    return this.prisma.$transaction(async (tx) => {
      await tx.userLesson.deleteMany({
        where: {
          userId,
          lessonId,
        },
      });

      await tx.userTeachingCompleted.deleteMany({
        where: {
          userId,
          teachingId: { in: teachingIds },
        },
      });

      if (questionIds.length > 0) {
        await tx.userQuestionPerformance.deleteMany({
          where: {
            userId,
            questionId: { in: questionIds },
          },
        });
      }

      return {
        message: `Progress for lesson ${lessonId} reset successfully`,
        lessonId,
      };
    });
  }

  async resetQuestionProgress(userId: string, questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    await this.prisma.userQuestionPerformance.deleteMany({
      where: {
        userId,
        questionId,
      },
    });

    return {
      message: `Progress for question ${questionId} reset successfully`,
      questionId,
    };
  }

  async calculateStreak(userId: string): Promise<number> {
    const now = new Date();

    const performances = await this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      select: {
        lastRevisedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (performances.length === 0) {
      return 0;
    }

    const mostRecentActivity = performances.reduce((latest, perf) => {
      const activityDate = perf.lastRevisedAt || perf.createdAt;
      if (!activityDate) return latest;
      const perfDate = new Date(activityDate);
      return perfDate > latest ? perfDate : latest;
    }, new Date(0));

    const hoursSinceLastActivity =
      (now.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastActivity > 48) {
      return 0;
    }

    const activeDays = new Set<string>();
    performances.forEach((perf) => {
      const activityDate = perf.lastRevisedAt || perf.createdAt;
      if (activityDate) {
        const date = new Date(activityDate);
        // Normalize to start of day in UTC
        const dayKey = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ),
        )
          .toISOString()
          .split('T')[0];
        activeDays.add(dayKey);
      }
    });

    // Convert to sorted array of dates (most recent first)
    const sortedDays = Array.from(activeDays)
      .map((day) => {
        const date = new Date(day);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDays.length === 0) {
      return 0;
    }

    const mostRecentDay = sortedDays[0];
    let streak = 1;
    const expectedDate = new Date(mostRecentDay);
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);

    for (let i = 1; i < sortedDays.length; i++) {
      const activeDay = sortedDays[i];
      const daysDiff = Math.floor(
        (expectedDate.getTime() - activeDay.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 0) {
        streak++;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else if (daysDiff > 0) {
        break;
      }
    }

    return streak;
  }

  async getProgressSummary(userId: string, tzOffsetMinutes?: number) {
    const now = new Date();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgePoints: true },
    });

    const xp = user?.knowledgePoints || 0;

    const dueCutoff = getEndOfLocalDayUtc(now, tzOffsetMinutes);
    const dueReviewCount = await this.getDueReviewCount(userId, dueCutoff);

    const userLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            teachings: {
              select: { id: true },
            },
            module: {
              select: { id: true },
            },
          },
        },
      },
    });

    const completedLessons = userLessons.filter(
      (ul) =>
        ul.completedTeachings >= ul.lesson.teachings.length &&
        ul.lesson.teachings.length > 0,
    ).length;

    const totalLessons = await this.prisma.lesson.count();

    const modules = await this.prisma.module.findMany({
      include: {
        lessons: {
          include: {
            teachings: {
              select: { id: true },
            },
          },
        },
      },
    });

    let completedModules = 0;
    for (const module of modules) {
      const moduleLessons = module.lessons;
      if (moduleLessons.length === 0) continue;

      const allLessonsCompleted = moduleLessons.every((lesson) => {
        const userLesson = userLessons.find((ul) => ul.lessonId === lesson.id);
        if (!userLesson) return false;
        return (
          userLesson.completedTeachings >= lesson.teachings.length &&
          lesson.teachings.length > 0
        );
      });

      if (allLessonsCompleted) {
        completedModules++;
      }
    }

    const totalModules = await this.prisma.module.count();

    const streak = await this.calculateStreak(userId);

    return {
      xp,
      streak,
      completedLessons,
      completedModules,
      totalLessons,
      totalModules,
      dueReviewCount,
    };
  }

  async markModuleCompleted(userId: string, moduleIdOrSlug: string) {
    const uuidCheck = isValidUuid(moduleIdOrSlug);

    let module;
    if (uuidCheck) {
      module = await this.prisma.module.findUnique({
        where: { id: moduleIdOrSlug },
        include: {
          lessons: {
            include: {
              teachings: {
                select: { id: true },
              },
            },
          },
        },
      });
    } else {
      const normalizedTitle = normalizeTitle(moduleIdOrSlug);

      module = await this.prisma.module.findFirst({
        where: {
          title: {
            equals: normalizedTitle,
            mode: 'insensitive',
          },
        },
        include: {
          lessons: {
            include: {
              teachings: {
                select: { id: true },
              },
            },
          },
        },
      });
    }

    if (!module) {
      throw new NotFoundException(
        `Module with ID or slug "${moduleIdOrSlug}" not found`,
      );
    }

    const results: Array<{
      lessonId: string;
      lessonTitle: string;
      completedTeachings: number;
    }> = [];

    for (const lesson of module.lessons) {
      const totalTeachings = lesson.teachings.length;

      const userLesson = await this.prisma.userLesson.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: lesson.id,
          },
        },
        update: {
          completedTeachings: totalTeachings,
          updatedAt: new Date(),
        },
        create: {
          userId,
          lessonId: lesson.id,
          completedTeachings: totalTeachings,
        },
      });

      for (const teaching of lesson.teachings) {
        await this.prisma.userTeachingCompleted.upsert({
          where: {
            userId_teachingId: {
              userId,
              teachingId: teaching.id,
            },
          },
          update: {},
          create: {
            userId,
            teachingId: teaching.id,
          },
        });
      }

      results.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        completedTeachings: totalTeachings,
      });
    }

    return {
      message: `Module "${module.title}" marked as completed`,
      moduleId: module.id,
      moduleTitle: module.title,
      lessonsCompleted: results.length,
      lessons: results,
    };
  }

  async getRecentAttempts(userId: string, limit: number = 10) {
    return this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        question: {
          select: {
            id: true,
            teaching: {
              select: {
                id: true,
                userLanguageString: true,
                learningLanguageString: true,
                lesson: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private normalizeAnswerForComparison(s: string): string {
    return s
      .replace(/\s*\([^)]*\)/g, ' ') // strip parentheticals e.g. "(formal)" so "Excuse me (formal)" matches "Excuse me"
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async validateInputFormat(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<any> {
    const variant = await this.prisma.questionVariant.findUnique({
      where: {
        questionId_deliveryMethod: {
          questionId,
          deliveryMethod,
        },
      },
      select: {
        data: true,
      },
    });

    if (!variant) {
      throw new BadRequestException(
        `Question ${questionId} does not support ${deliveryMethod} delivery method`,
      );
    }

    return (variant.data ?? undefined) as any | undefined;
  }

  private async fetchAnswerData(
    userId: string,
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        teaching: {
          include: {
            lesson: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const lessonId = question.teaching.lesson.id;
    const teaching = question.teaching;

    const questionData = await this.contentLookup.getQuestionData(
      questionId,
      lessonId,
      deliveryMethod,
    );

    if (!questionData) {
      throw new NotFoundException(
        `Question data not found for question ${questionId} in lesson ${lessonId}`,
      );
    }

    const onboardingPrefs =
      await this.onboardingPreferences.getOnboardingPreferences(userId);
    const feedbackDepth = onboardingPrefs.feedbackDepth ?? 0.6;

    return {
      question,
      teaching,
      questionData,
      lessonId,
      feedbackDepth,
    };
  }

  /** Result of comparing user answer to primary and optional acceptable-alternative lists. */
  private compareAnswersResult(
    deliveryMethod: DELIVERY_METHOD,
    userAnswer: string,
    questionData: any,
    teaching: any,
    variantData: any,
  ): { exact: boolean; meaningCorrect: boolean } {
    if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
      if (!questionData.correctOptionId) {
        throw new BadRequestException(
          `Question does not support MULTIPLE_CHOICE delivery method`,
        );
      }
      const exact = userAnswer === questionData.correctOptionId;
      return { exact, meaningCorrect: false };
    }

    const normalizedUserAnswer = this.normalizeAnswerForComparison(userAnswer);
    let correctAnswerSource: string;

    if (
      deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
      deliveryMethod === DELIVERY_METHOD.FLASHCARD
    ) {
      correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : teaching.userLanguageString;
    } else if (
      deliveryMethod === DELIVERY_METHOD.FILL_BLANK ||
      deliveryMethod === DELIVERY_METHOD.SPEECH_TO_TEXT ||
      deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH
    ) {
      correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : teaching.learningLanguageString;
    } else {
      throw new BadRequestException(
        `Unsupported delivery method for validation: ${deliveryMethod}`,
      );
    }

    const primaryAnswers = correctAnswerSource
      .toLowerCase()
      .split('/')
      .map((ans) => ans.trim())
      .filter((ans) => ans.length > 0);

    const exact = primaryAnswers.some(
      (correctAns) =>
        this.normalizeAnswerForComparison(correctAns) === normalizedUserAnswer,
    );

    let meaningCorrect = false;
    if (
      !exact &&
      (deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
        deliveryMethod === DELIVERY_METHOD.FLASHCARD)
    ) {
      const alternativesSource =
        typeof variantData?.acceptableAlternatives === 'string' &&
        variantData.acceptableAlternatives.trim().length > 0
          ? variantData.acceptableAlternatives
          : null;
      if (alternativesSource) {
        const alternatives = alternativesSource
          .split('/')
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
        meaningCorrect = alternatives.some(
          (alt) =>
            this.normalizeAnswerForComparison(alt) === normalizedUserAnswer,
        );
      }
    }

    return { exact, meaningCorrect };
  }

  private compareAnswers(
    deliveryMethod: DELIVERY_METHOD,
    userAnswer: string,
    questionData: any,
    teaching: any,
    variantData: any,
  ): boolean {
    const { exact } = this.compareAnswersResult(
      deliveryMethod,
      userAnswer,
      questionData,
      teaching,
      variantData,
    );
    return exact;
  }

  private calculateAnswerScore(isCorrect: boolean): number{
    return isCorrect ? 100 : 0;
  }

  private buildValidationResponse(
    isCorrect: boolean,
    score: number,
    questionData: any,
    teaching: any,
    feedbackDepth: number,
    grammaticalCorrectness?: number,
    extra?: {
      meaningCorrect: boolean;
      naturalPhrasing?: string;
      feedbackWhy?: string;
      acceptedVariants?: string[];
    },
  ): ValidateAnswerResponseDto {
    let feedback: string | undefined;
    if (extra?.meaningCorrect && !isCorrect && extra.naturalPhrasing) {
      feedback = `Meaning is correct; more natural phrasing: "${extra.naturalPhrasing}"`;
    } else {
      feedback = this.buildFeedback(
        isCorrect,
        questionData.hint,
        teaching,
        feedbackDepth,
      );
    }

    return {
      isCorrect,
      score,
      feedback,
      ...(grammaticalCorrectness !== undefined && { grammaticalCorrectness }),
      ...(extra?.meaningCorrect !== undefined && { meaningCorrect: extra.meaningCorrect }),
      ...(extra?.naturalPhrasing !== undefined && { naturalPhrasing: extra.naturalPhrasing }),
      ...(extra?.feedbackWhy !== undefined && extra.feedbackWhy && { feedbackWhy: extra.feedbackWhy }),
      ...(extra?.acceptedVariants !== undefined &&
        extra.acceptedVariants.length > 0 && { acceptedVariants: extra.acceptedVariants }),
    };
  }

  async validateAnswer(
    userId: string,
    questionId: string,
    dto: ValidateAnswerDto,
  ): Promise<ValidateAnswerResponseDto> {
    const variantData = await this.validateInputFormat(
      questionId,
      dto.deliveryMethod,
    );

    const { question, teaching, questionData, feedbackDepth } =
      await this.fetchAnswerData(userId, questionId, dto.deliveryMethod);

    const compareResult = this.compareAnswersResult(
      dto.deliveryMethod,
      dto.answer,
      questionData,
      teaching,
      variantData,
    );
    // For translation/flashcard, accept both exact and meaning-correct answers (e.g. "What's the time" / "What is the time?")
    const isCorrect =
      compareResult.exact ||
      (compareResult.meaningCorrect &&
        (dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
          dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD));

    const score = this.calculateAnswerScore(isCorrect);

    let grammaticalCorrectness: number | undefined;
    if (
      GRAMMATICAL_TEXT_METHODS.includes(dto.deliveryMethod) &&
      typeof dto.answer === 'string' &&
      dto.answer.trim().length > 0
    ) {
      const grammarLang = getGrammarCheckLanguageCode(dto.deliveryMethod);
      const grammarResult = await this.grammarService.checkGrammar(
        dto.answer.trim(),
        grammarLang,
      );
      if (grammarResult !== null) {
        grammaticalCorrectness = Math.round(grammarResult.score);
      }
    }

    let extra: {
      meaningCorrect: boolean;
      naturalPhrasing?: string;
      feedbackWhy?: string;
      acceptedVariants?: string[];
    } | undefined;
    if (
      compareResult.meaningCorrect &&
      !compareResult.exact &&
      (dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
        dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD)
    ) {
      const correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : teaching.userLanguageString ?? '';
      const primaryDisplayList = correctAnswerSource
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      const naturalPhrasing = primaryDisplayList[0];
      const acceptedVariants = primaryDisplayList.slice(1);
      const feedbackWhy =
        typeof variantData?.feedbackWhy === 'string' &&
        variantData.feedbackWhy.trim().length > 0
          ? variantData.feedbackWhy
          : teaching.tip;

      extra = {
        meaningCorrect: true,
        naturalPhrasing,
        ...(feedbackWhy && { feedbackWhy }),
        ...(acceptedVariants.length > 0 && { acceptedVariants }),
      };
    } else if (
      compareResult.exact &&
      (dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
        dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD)
    ) {
      const correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : teaching.userLanguageString ?? '';
      const primaryDisplayList = correctAnswerSource
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      const acceptedVariants = primaryDisplayList.slice(1);
      if (acceptedVariants.length > 0) {
        extra = {
          meaningCorrect: false,
          acceptedVariants,
        };
      }
    }

    // Only return grammatical correctness when the answer is correct or meaning-correct.
    // When the answer is wrong, a grammar % is misleading (e.g. "How come" is grammatical
    // English but wrong for "Come sta?" — we should not imply they were "85% right").
    const includeGrammarScore =
      (isCorrect || extra?.meaningCorrect === true) && grammaticalCorrectness !== undefined;
    return this.buildValidationResponse(
      isCorrect,
      score,
      questionData,
      teaching,
      feedbackDepth,
      includeGrammarScore ? grammaticalCorrectness : undefined,
      extra,
    );
  }

  private buildFeedback(
    isCorrect: boolean,
    hint: string | undefined,
    teaching: any,
    feedbackDepth: number,
  ): string | undefined {
    if (feedbackDepth < 0.45) {
      return undefined;
    }

    if (feedbackDepth < 0.75) {
      if (!isCorrect && hint) {
        return hint;
      }
      return undefined;
    }

    if (!isCorrect) {
      let detailedFeedback = '';
      if (hint) {
        detailedFeedback = hint;
      }
      if (teaching.tip) {
        if (detailedFeedback) {
          detailedFeedback += ` ${teaching.tip}`;
        } else {
          detailedFeedback = teaching.tip;
        }
      }
      if (teaching.userLanguageString && teaching.learningLanguageString) {
        const translationNote = `Remember: "${teaching.learningLanguageString}" means "${teaching.userLanguageString}"`;
        if (detailedFeedback) {
          detailedFeedback += ` ${translationNote}`;
        } else {
          detailedFeedback = translationNote;
        }
      }
      return detailedFeedback || undefined;
    }

    if (isCorrect && feedbackDepth >= 0.75) {
      return 'Excellent!';
    }

    return undefined;
  }

  async validatePronunciation(
    userId: string,
    questionId: string,
    dto: ValidatePronunciationDto,
  ): Promise<PronunciationResponseDto> {
    const [question, variant] = await Promise.all([
      this.prisma.question.findUnique({
        where: { id: questionId },
        include: {
          teaching: {
            select: {
              id: true,
              learningLanguageString: true,
              userLanguageString: true,
            },
          },
        },
      }),
      this.prisma.questionVariant.findUnique({
        where: {
          questionId_deliveryMethod: {
            questionId,
            deliveryMethod: DELIVERY_METHOD.TEXT_TO_SPEECH,
          },
        },
        select: { data: true },
      }),
    ]);

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    if (!variant) {
      throw new BadRequestException(
        `Question ${questionId} does not support TEXT_TO_SPEECH delivery method`,
      );
    }

    const variantAnswer =
      variant.data &&
      typeof variant.data === 'object' &&
      !Array.isArray(variant.data) &&
      typeof variant.data['answer'] === 'string'
        ? variant.data['answer'].trim()
        : '';

    const expectedText =
      variantAnswer.length > 0
        ? variantAnswer
        : question.teaching.learningLanguageString;

    if (dto.audioFormat !== 'wav') {
      throw new BadRequestException(
        'Only "wav" audioFormat is supported for pronunciation assessment',
      );
    }

    const assessment = await this.pronunciationService.assess({
      audioBase64: dto.audioBase64,
      referenceText: expectedText,
      locale: 'it-IT',
    });

    const overallScore = Math.round(assessment.scores.pronunciation);

    const refWords = expectedText
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    const words: WordAnalysisDto[] =
      assessment.words.length > 0
        ? (() => {
            // Align to reference text so we show one row per expected word and avoid
            // duplicate entries when Azure returns the same word twice (e.g. from
            // reference alignment and recognition).
            const mapped: WordAnalysisDto[] = [];
            let j = 0;
            for (const refWord of refWords) {
              while (
                j < assessment.words.length &&
                assessment.words[j].word.toLowerCase() !== refWord.toLowerCase()
              ) {
                j++;
              }
              if (j < assessment.words.length) {
                const w = assessment.words[j];
                const wordScore = Math.round(w.accuracy);
                mapped.push({
                  word: w.word,
                  score: wordScore,
                  feedback: wordScore >= 85 ? 'perfect' : 'could_improve',
                  ...(w.errorType &&
                    w.errorType !== 'None' && { errorType: w.errorType }),
                  ...(w.phonemes &&
                    w.phonemes.length > 0 && {
                      phonemes: w.phonemes.map((p) => ({
                        phoneme: p.phoneme,
                        accuracy: Math.round(
                          Math.max(0, Math.min(100, p.accuracy)),
                        ),
                      })),
                    }),
                });
                j++;
              } else {
                mapped.push({
                  word: refWord,
                  score: overallScore,
                  feedback: overallScore >= 85 ? 'perfect' : 'could_improve',
                });
              }
            }
            return mapped;
          })()
        : refWords.map((word) => ({
            word,
            score: overallScore,
            feedback: overallScore >= 85 ? 'perfect' : 'could_improve',
          }));

    const transcription = assessment.recognizedText || '';
    const isCorrect = overallScore >= 80;

    return {
      overallScore,
      transcription,
      words,
      isCorrect,
      score: overallScore,
    };
  }
}
