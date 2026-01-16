import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { ValidateAnswerResponseDto } from './dto/validate-answer-response.dto';
import { ValidatePronunciationDto } from './dto/validate-pronunciation.dto';
import { PronunciationResponseDto, WordAnalysisDto } from './dto/pronunciation-response.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { SrsService } from '../engine/srs/srs.service';
import { XpService } from '../engine/scoring/xp.service';
import { ContentLookupService } from '../content/content-lookup.service';
import { MasteryService } from '../engine/mastery/mastery.service';
import { extractSkillTags } from '../engine/mastery/skill-extraction.util';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private srsService: SrsService,
    private xpService: XpService,
    private contentLookup: ContentLookupService,
    private masteryService: MasteryService,
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
    // Verify question exists and load teaching with lesson for skill extraction
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
    const isCorrect = attemptDto.score >= 80; // Threshold for "correct"

    // Calculate SRS state using FSRS algorithm
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

    // Update mastery for associated skill tags using BKT
    try {
      const skillTags = extractSkillTags(question);
      const lowMasterySkills: string[] = [];

      for (const skillTag of skillTags) {
        const newMastery = await this.masteryService.updateMastery(
          userId,
          skillTag,
          isCorrect,
        );

        // Check if mastery dropped below 0.5
        if (newMastery < 0.5) {
          lowMasterySkills.push(skillTag);
        }
      }

      // Signal ContentDeliveryService to prioritize 'New' teachings for low mastery skills
      // This is done implicitly - ContentDeliveryService will check for low mastery skills
      // when creating session plans (see ContentDeliveryService enhancement)
      if (lowMasterySkills.length > 0) {
        // Log for debugging/monitoring
        console.log(
          `User ${userId} has low mastery (<0.5) for skills: ${lowMasterySkills.join(', ')}`,
        );
      }
    } catch (error) {
      // Log but don't fail - mastery tracking is non-critical
      console.error('Error updating mastery:', error);
    }

    // Award XP using engine
    const awardedXp = await this.xpService.award(userId, {
      type: 'attempt',
      correct: isCorrect,
      timeMs: attemptDto.timeToComplete || 0,
    });

    // Record knowledge level progress (append-only log of XP gains)
    if (awardedXp > 0) {
      try {
        await this.recordKnowledgeLevelProgress(userId, {
          value: awardedXp,
        });
      } catch (error) {
        // Log but don't fail - progress recording is non-critical
        console.error('Error recording knowledge level progress:', error);
      }
    }

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

  async calculateStreak(userId: string): Promise<number> {
    const now = new Date();

    // Get all UserQuestionPerformance entries for the user
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

    // If no activity, return 0
    if (performances.length === 0) {
      return 0;
    }

    // Get the most recent activity timestamp (max of lastRevisedAt and createdAt)
    const mostRecentActivity = performances.reduce((latest, perf) => {
      const activityDate = perf.lastRevisedAt || perf.createdAt;
      if (!activityDate) return latest;
      const perfDate = new Date(activityDate);
      return perfDate > latest ? perfDate : latest;
    }, new Date(0));

    // Calculate hours since last activity
    const hoursSinceLastActivity = (now.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60);

    // If more than 48 hours since last activity, streak is broken
    if (hoursSinceLastActivity > 48) {
      return 0;
    }

    // Group activities by calendar day (using max of lastRevisedAt and createdAt)
    const activeDays = new Set<string>();
    performances.forEach((perf) => {
      const activityDate = perf.lastRevisedAt || perf.createdAt;
      if (activityDate) {
        const date = new Date(activityDate);
        // Normalize to start of day in UTC
        const dayKey = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
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

    // Start counting from the most recent activity day
    const mostRecentDay = sortedDays[0];
    let streak = 1; // Count the most recent day
    let expectedDate = new Date(mostRecentDay);
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1); // Move to previous day

    // Count consecutive days working backwards
    for (let i = 1; i < sortedDays.length; i++) {
      const activeDay = sortedDays[i];
      const daysDiff = Math.floor((expectedDate.getTime() - activeDay.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // This is the expected consecutive day
        streak++;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else if (daysDiff > 0) {
        // There's a gap - streak is broken
        break;
      }
      // If daysDiff < 0, this day is before expected (shouldn't happen with sorted array), skip it
    }

    return streak;
  }

  async getProgressSummary(userId: string) {
    const now = new Date();

    // Get XP total from user.knowledgePoints (updated by XpService)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgePoints: true },
    });

    const xp = user?.knowledgePoints || 0;

    // Count deduped due reviews (latest per question where nextReviewDue <= now)
    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId - keep only the latest per question
    const questionIdSet = new Set<string>();
    const dedupedDueReviews = dueReviews.filter((review) => {
      if (questionIdSet.has(review.questionId)) {
        return false;
      }
      questionIdSet.add(review.questionId);
      return true;
    });

    const dueReviewCount = dedupedDueReviews.length;

    // Count completed lessons (lessons where all teachings are completed)
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

    // Count lessons where completedTeachings equals total teachings
    const completedLessons = userLessons.filter(
      (ul) => ul.completedTeachings >= ul.lesson.teachings.length && ul.lesson.teachings.length > 0,
    ).length;

    const totalLessons = await this.prisma.lesson.count();

    // Count completed modules (modules where all lessons are completed)
    // Get all modules and check which ones are fully completed
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

      // Check if all lessons in this module are completed
      const allLessonsCompleted = moduleLessons.every((lesson) => {
        const userLesson = userLessons.find((ul) => ul.lessonId === lesson.id);
        if (!userLesson) return false;
        return userLesson.completedTeachings >= lesson.teachings.length && lesson.teachings.length > 0;
      });

      if (allLessonsCompleted) {
        completedModules++;
      }
    }

    const totalModules = await this.prisma.module.count();

    // Calculate streak using the new method
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
    // Find module by ID or slug (title)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleIdOrSlug);
    
    let module;
    if (isUuid) {
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
      // Find by title (case-insensitive, normalized)
      const normalizedTitle = moduleIdOrSlug
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
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
      throw new NotFoundException(`Module with ID or slug "${moduleIdOrSlug}" not found`);
    }

    // Mark all lessons in the module as completed
    // For each lesson, mark all teachings as completed
    const results: Array<{ lessonId: string; lessonTitle: string; completedTeachings: number }> = [];
    
    for (const lesson of module.lessons) {
      const totalTeachings = lesson.teachings.length;
      
      // Upsert UserLesson with completedTeachings = totalTeachings
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

      // Mark all teachings as completed
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
    // Get recent question attempts for debugging/dev purposes
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

  async validateAnswer(
    userId: string,
    questionId: string,
    dto: ValidateAnswerDto,
  ): Promise<ValidateAnswerResponseDto> {
    // Get question from DB (includes teachingId)
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

    // Get question data using Teaching relationship
    const questionData = await this.contentLookup.getQuestionData(questionId, lessonId, dto.deliveryMethod);

    if (!questionData) {
      throw new NotFoundException(
        `Question data not found for question ${questionId} in lesson ${lessonId}`,
      );
    }

    // Validate based on delivery method
    let isCorrect = false;
    let score = 0;
    let feedback: string | undefined;

    if (dto.deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
      // For multiple choice, compare option ID
      if (!questionData.correctOptionId) {
        throw new BadRequestException(
          `Question ${questionId} does not support MULTIPLE_CHOICE delivery method`,
        );
      }
      isCorrect = dto.answer === questionData.correctOptionId;
      score = isCorrect ? 100 : 0;
    } else if (
      dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
      dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD
    ) {
      // Translation: use acceptedAnswers from QuestionTextTranslation if available, otherwise fall back to userLanguageString
      const normalizedUserAnswer = dto.answer.toLowerCase().trim();
      let correctAnswers: string[] = [];

      // Try to get acceptedAnswers from QuestionTextTranslation table
      const textTranslation = await this.prisma.questionTextTranslation.findUnique({
        where: { questionId },
        select: { acceptedAnswers: true },
      });

      if (textTranslation && textTranslation.acceptedAnswers && textTranslation.acceptedAnswers.length > 0) {
        // Use acceptedAnswers from database
        correctAnswers = textTranslation.acceptedAnswers.map((ans) => ans.toLowerCase().trim());
      } else {
        // Fallback: use userLanguageString and split by "/"
        const correctAnswer = teaching.userLanguageString.toLowerCase().trim();
        correctAnswers = correctAnswer
          .split('/')
          .map((ans) => ans.trim())
          .filter((ans) => ans.length > 0);
      }
      
      isCorrect = correctAnswers.some((correctAns) => correctAns === normalizedUserAnswer);
      score = isCorrect ? 100 : 0;

      if (!isCorrect && questionData.hint) {
        feedback = questionData.hint;
      }
    } else if (dto.deliveryMethod === DELIVERY_METHOD.FILL_BLANK) {
      // Fill blank: compare against learningLanguageString
      const normalizedUserAnswer = dto.answer.toLowerCase().trim();
      const correctAnswer = teaching.learningLanguageString.toLowerCase().trim();
      
      const correctAnswers = correctAnswer
        .split('/')
        .map((ans) => ans.trim())
        .filter((ans) => ans.length > 0);
      
      isCorrect = correctAnswers.some((correctAns) => correctAns === normalizedUserAnswer);
      score = isCorrect ? 100 : 0;

      if (!isCorrect && questionData.hint) {
        feedback = questionData.hint;
      }
    } else if (
      dto.deliveryMethod === DELIVERY_METHOD.SPEECH_TO_TEXT ||
      dto.deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH
    ) {
      // Listening: compare against learningLanguageString
      const normalizedUserAnswer = dto.answer.toLowerCase().trim();
      const correctAnswer = teaching.learningLanguageString.toLowerCase().trim();
      
      const correctAnswers = correctAnswer
        .split('/')
        .map((ans) => ans.trim())
        .filter((ans) => ans.length > 0);
      
      isCorrect = correctAnswers.some((correctAns) => correctAns === normalizedUserAnswer);
      score = isCorrect ? 100 : 0;
    } else {
      throw new BadRequestException(
        `Unsupported delivery method for validation: ${dto.deliveryMethod}`,
      );
    }

    return {
      isCorrect,
      score,
      feedback,
    };
  }

  async validatePronunciation(
    userId: string,
    questionId: string,
    dto: ValidatePronunciationDto,
  ): Promise<PronunciationResponseDto> {
    // Verify question exists and is TEXT_TO_SPEECH type
    const question = await this.prisma.question.findUnique({
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
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    if (question.type !== DELIVERY_METHOD.TEXT_TO_SPEECH) {
      throw new BadRequestException(
        `Question ${questionId} does not support TEXT_TO_SPEECH delivery method`,
      );
    }

    const expectedText = question.teaching.learningLanguageString;

    try {
      // Import Google Cloud Speech client
      const { SpeechClient } = require('@google-cloud/speech');
      const client = new SpeechClient();

      // Convert base64 to buffer
      const audioBytes = Buffer.from(dto.audioBase64, 'base64');

      // Configure request for Italian language with pronunciation assessment
      // Handle different audio formats correctly for Google Cloud Speech API
      // Note: M4A files contain AAC audio, which Google Cloud Speech doesn't directly support
      // We'll use MP3 encoding as a workaround, or better: record in a supported format
      let encoding: string;
      let sampleRateHertz: number;
      
      if (dto.audioFormat === 'wav') {
        encoding = 'LINEAR16';
        sampleRateHertz = 16000;
      } else if (dto.audioFormat === 'flac') {
        encoding = 'FLAC';
        sampleRateHertz = 16000;
      } else if (dto.audioFormat === 'm4a') {
        // M4A contains AAC audio - Google Cloud Speech API doesn't support AAC directly
        // Try using MP3 encoding as workaround (M4A container with AAC is similar)
        // Better solution: record in WAV or FLAC format
        encoding = 'MP3';
        sampleRateHertz = 44100; // Match the recording sample rate from mobile app
      } else if (dto.audioFormat === 'mp3') {
        encoding = 'MP3';
        sampleRateHertz = 44100;
      } else if (dto.audioFormat === 'ogg') {
        encoding = 'OGG_OPUS';
        sampleRateHertz = 48000; // OGG Opus typically uses 48kHz
      } else {
        // Default to FLAC for unknown formats
        encoding = 'FLAC';
        sampleRateHertz = 16000;
      }

      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: encoding as any,
          sampleRateHertz: sampleRateHertz,
          languageCode: 'it-IT',
          enableAutomaticPunctuation: true,
          enablePronunciationAssessment: true,
          pronunciationAssessmentConfig: {
            referenceText: expectedText,
            granularity: 'WORD',
            scoreType: 'OVERALL',
          },
        },
      };

      // Call Google Cloud Speech-to-Text API
      const [response] = await client.recognize(request);

      if (!response.results || response.results.length === 0) {
        throw new BadRequestException('No speech detected in audio');
      }

      const result = response.results[0];
      const transcription = result.alternatives[0]?.transcript || '';
      const pronunciationAssessment = result.alternatives[0]?.pronunciationAssessment;

      if (!pronunciationAssessment) {
        throw new BadRequestException('Pronunciation assessment not available');
      }

      // Calculate overall score (0-100)
      const overallScore = Math.round(pronunciationAssessment.pronunciationScore || 0);

      // Process word-level analysis
      const words: WordAnalysisDto[] = [];
      if (pronunciationAssessment.words && result.alternatives[0]?.words) {
        for (let i = 0; i < pronunciationAssessment.words.length; i++) {
          const wordAssessment = pronunciationAssessment.words[i];
          const wordInfo = result.alternatives[0].words[i];
          
          if (wordAssessment && wordInfo) {
            const wordScore = Math.round(wordAssessment.pronunciationScore || 0);
            words.push({
              word: wordInfo.word,
              score: wordScore,
              feedback: wordScore >= 85 ? 'perfect' : 'could_improve',
            });
          }
        }
      }

      // If no word-level data, create from overall score
      if (words.length === 0 && expectedText) {
        const expectedWords = expectedText.split(/\s+/);
        const avgWordScore = overallScore;
        expectedWords.forEach((word) => {
          words.push({
            word: word.trim(),
            score: avgWordScore,
            feedback: avgWordScore >= 85 ? 'perfect' : 'could_improve',
          });
        });
      }

      const isCorrect = overallScore >= 80; // Threshold for "correct"

      return {
        overallScore,
        transcription,
        words,
        isCorrect,
        score: overallScore,
      };
    } catch (error) {
      console.error('Error validating pronunciation:', error);
      
      // Fallback: simple transcription comparison if Google Cloud fails
      // This is a basic fallback - in production, you'd want better error handling
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to validate pronunciation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
