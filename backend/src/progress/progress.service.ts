import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { SrsService } from '../engine/srs/srs.service';
import { XpService } from '../engine/scoring/xp.service';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private srsService: SrsService,
    private xpService: XpService,
  ) {}

  async startLesson(userId: string, lessonId: string) {
    // Upsert UserLesson idempotently
    return this.prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completedTeachings: 0,
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

  async getUserLessons(userId: string) {
    return this.prisma.userLesson.findMany({
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
  }

  async completeTeaching(userId: string, teachingId: string) {
    // Transaction: create UserTeachingCompleted if not exists, then increment counter
    return this.prisma.$transaction(async (tx) => {
      // Get teaching to find lessonId
      const teaching = await tx.teaching.findUnique({
        where: { id: teachingId },
        select: { lessonId: true },
      });

      if (!teaching) {
        throw new NotFoundException(`Teaching with ID ${teachingId} not found`);
      }

      // Try to create UserTeachingCompleted (will fail if exists due to composite PK)
      let wasNewlyCompleted = false;
      try {
        await tx.userTeachingCompleted.create({
          data: {
            userId,
            teachingId,
          },
        });
        wasNewlyCompleted = true;
      } catch (error) {
        // Already exists, that's fine - idempotent
      }

      // If newly completed, increment UserLesson.completedTeachings
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

      // Return updated UserLesson
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

      return {
        userLesson,
        wasNewlyCompleted,
      };
    });
  }

  async recordQuestionAttempt(userId: string, questionId: string, attemptDto: QuestionAttemptDto) {
    // Verify question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const now = new Date();
    const isCorrect = attemptDto.score >= 80; // Threshold for "correct"

    // Calculate SRS state using SM-2 algorithm
    const srsState = await this.srsService.calculateQuestionState(
      userId,
      questionId,
      {
        correct: isCorrect,
        timeMs: attemptDto.timeToComplete || 0,
        score: attemptDto.score,
      },
    );

    // Record attempt in UserQuestionPerformance (append-only) with SRS state
    const performance = await this.prisma.userQuestionPerformance.create({
      data: {
        userId,
        questionId,
        score: attemptDto.score,
        timeToComplete: attemptDto.timeToComplete,
        percentageAccuracy: attemptDto.percentageAccuracy,
        attempts: attemptDto.attempts,
        lastRevisedAt: now,
        nextReviewDue: srsState.nextReviewDue,
        intervalDays: srsState.intervalDays,
        easeFactor: srsState.easeFactor,
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

    // Award XP using engine
    const awardedXp = await this.xpService.award(userId, {
      type: 'attempt',
      correct: isCorrect,
      timeMs: attemptDto.timeToComplete || 0,
    });

    // SRS state is stored directly in UserQuestionPerformance (no separate table needed)

    // Return performance with XP info
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

  async getDueReviewsLatest(userId: string) {
    const now = new Date();

    // Get all due reviews
    const allDueReviews = await this.prisma.userQuestionPerformance.findMany({
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
              include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId - keep only the most recent per question
    const questionIdMap = new Map<string, typeof allDueReviews[0]>();
    allDueReviews.forEach((review) => {
      const existing = questionIdMap.get(review.questionId);
      if (!existing || review.createdAt > existing.createdAt) {
        questionIdMap.set(review.questionId, review);
      }
    });

    return Array.from(questionIdMap.values());
  }

  async updateDeliveryMethodScore(userId: string, method: DELIVERY_METHOD, scoreDto: DeliveryMethodScoreDto) {
    // Upsert with score clamped to 0..1
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

  async recordKnowledgeLevelProgress(userId: string, progressDto: KnowledgeLevelProgressDto) {
    // Transaction: insert progress row and increment User.knowledgePoints
    return this.prisma.$transaction(async (tx) => {
      // Insert progress row (append-only)
      const progressRow = await tx.userKnowledgeLevelProgress.create({
        data: {
          userId,
          value: progressDto.value,
        },
      });

      // Increment User.knowledgePoints
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
    // Transaction to reset all user progress
    return this.prisma.$transaction(async (tx) => {
      // Delete all progress records
      await tx.userLesson.deleteMany({ where: { userId } });
      await tx.userTeachingCompleted.deleteMany({ where: { userId } });
      await tx.userQuestionPerformance.deleteMany({ where: { userId } });

      // Optionally reset XP and knowledge points
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

      // Optionally reset delivery method scores
      if (options?.includeDeliveryMethodScores) {
        await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });
      }

      return {
        message: 'All progress reset successfully',
        resetXp: options?.includeXp || false,
        resetDeliveryMethodScores: options?.includeDeliveryMethodScores || false,
      };
    });
  }

  async resetLessonProgress(userId: string, lessonId: string) {
    // Verify lesson exists
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

    // Get all question IDs in this lesson
    const questionIds = lesson.teachings.flatMap((t) => t.questions.map((q) => q.id));
    const teachingIds = lesson.teachings.map((t) => t.id);

    // Transaction to reset lesson-specific progress
    return this.prisma.$transaction(async (tx) => {
      // Delete UserLesson
      await tx.userLesson.deleteMany({
        where: {
          userId,
          lessonId,
        },
      });

      // Delete completed teachings for this lesson
      await tx.userTeachingCompleted.deleteMany({
        where: {
          userId,
          teachingId: { in: teachingIds },
        },
      });

      // Delete question performance for questions in this lesson
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
    // Verify question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Delete all performance records for this question
    // Note: This is append-only, so we delete all historical attempts
    // In a production system, you might want to mark as "reset" instead of deleting
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
}
