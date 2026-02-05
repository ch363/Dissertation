import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { SrsService } from '../engine/srs/srs.service';
import { XpService } from '../engine/scoring/xp.service';
import { MasteryService } from '../engine/mastery/mastery.service';
import { SessionPlanCacheService } from '../engine/content-delivery/session-plan-cache.service';
import { extractSkillTags } from '../engine/mastery/skill-extraction.util';
import { LoggerService } from '../common/logger';
import { getEndOfLocalDayUtc } from '../common/utils/date.util';

/**
 * QuestionAttemptService
 * 
 * Manages question attempts, SRS scheduling, and due reviews.
 * Follows Single Responsibility Principle - focused on question practice tracking.
 */
@Injectable()
export class QuestionAttemptService {
  private readonly logger = new LoggerService(QuestionAttemptService.name);

  constructor(
    private prisma: PrismaService,
    private srsService: SrsService,
    private xpService: XpService,
    private masteryService: MasteryService,
    private sessionPlanCache: SessionPlanCacheService,
  ) {}

  /**
   * Record a question attempt and update SRS state, mastery, and award XP.
   */
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

    // Calculate SRS state
    const srsState = await this.srsService.calculateQuestionState(
      userId,
      questionId,
      {
        correct: isCorrect,
        timeMs: attemptDto.timeToComplete || 0,
        score: attemptDto.score,
      },
    );

    // Create performance record
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

    // Update mastery for all relevant skills
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
        this.logger.logInfo('User has low mastery skills', {
          userId,
          skills: lowMasterySkills,
          threshold: 0.5,
        });
      }
    } catch (error) {
      this.logger.logError('Error updating mastery', error, { userId });
    }

    // Award XP
    const awardedXp = await this.xpService.award(userId, {
      type: 'attempt',
      correct: isCorrect,
      timeMs: attemptDto.timeToComplete || 0,
    });

    // Invalidate session plan cache
    this.sessionPlanCache.invalidate(userId);

    return {
      ...performance,
      awardedXp,
    };
  }

  /**
   * Get all due reviews for a user (legacy method).
   */
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
                emoji: true,
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
   * Get count of due reviews using latest performance per question.
   */
  async getDueReviewCount(
    userId: string,
    dueCutoff?: Date,
  ): Promise<number> {
    const cutoff = dueCutoff || getEndOfLocalDayUtc(new Date(), 0);

    // Get latest performance per question
    const latestPerformances =
      await this.prisma.userQuestionPerformance.groupBy({
        by: ['questionId'],
        where: { userId },
        _max: {
          createdAt: true,
        },
      });

    if (latestPerformances.length === 0) {
      return 0;
    }

    // Fetch actual performance records
    const performances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        OR: latestPerformances.map((lp) => ({
          questionId: lp.questionId,
          createdAt: lp._max.createdAt!,
        })),
      },
    });

    // Count how many are due
    const dueCount = performances.filter(
      (p) => p.nextReviewDue && p.nextReviewDue <= cutoff,
    ).length;

    return dueCount;
  }

  /**
   * Get due reviews using latest performance per question (not all historical records).
   */
  async getDueReviewsLatest(userId: string) {
    const now = new Date();

    // Get latest performance per question
    const latestPerformances =
      await this.prisma.userQuestionPerformance.groupBy({
        by: ['questionId'],
        where: { userId },
        _max: {
          createdAt: true,
        },
      });

    if (latestPerformances.length === 0) {
      return [];
    }

    // Fetch actual performance records
    const performances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        OR: latestPerformances.map((lp) => ({
          questionId: lp.questionId,
          createdAt: lp._max.createdAt!,
        })),
      },
      include: {
        question: {
          include: {
            teaching: {
              select: {
                id: true,
                userLanguageString: true,
                learningLanguageString: true,
                emoji: true,
              },
            },
          },
        },
      },
    });

    // Filter and sort due reviews
    return performances
      .filter((p) => p.nextReviewDue && p.nextReviewDue <= now)
      .sort((a, b) => {
        const aTime = a.nextReviewDue?.getTime() || 0;
        const bTime = b.nextReviewDue?.getTime() || 0;
        return aTime - bTime;
      });
  }

  /**
   * Get recent attempts for debugging purposes.
   */
  async getRecentAttempts(userId: string, limit: number = 20) {
    return this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            teaching: {
              select: {
                userLanguageString: true,
                learningLanguageString: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
