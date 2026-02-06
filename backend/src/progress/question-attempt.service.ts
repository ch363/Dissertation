import { Injectable, NotFoundException } from '@nestjs/common';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { SrsService } from '../engine/srs/srs.service';
import { XpService } from '../engine/scoring/xp.service';
import { MasteryService } from '../engine/mastery/mastery.service';
import { SessionPlanCacheService } from '../engine/content-delivery/session-plan-cache.service';
import { UserQuestionPerformanceRepository } from '../engine/repositories';
import { QuestionRepository } from '../questions/questions.repository';
import { extractSkillTags } from '../engine/mastery/skill-extraction.util';
import { LoggerService } from '../common/logger';
import { getEndOfLocalDayUtc } from '../common/utils/date.util';

/**
 * QuestionAttemptService
 * 
 * Manages question attempts, SRS scheduling, and due reviews.
 * Follows Single Responsibility Principle - focused on question practice tracking.
 * 
 * DIP Compliance: Uses repository abstractions instead of direct Prisma access.
 */
@Injectable()
export class QuestionAttemptService {
  private readonly logger = new LoggerService(QuestionAttemptService.name);

  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly userQuestionPerformanceRepository: UserQuestionPerformanceRepository,
    private readonly srsService: SrsService,
    private readonly xpService: XpService,
    private readonly masteryService: MasteryService,
    private readonly sessionPlanCache: SessionPlanCacheService,
  ) {}

  /**
   * Record a question attempt and update SRS state, mastery, and award XP.
   */
  async recordQuestionAttempt(
    userId: string,
    questionId: string,
    attemptDto: QuestionAttemptDto,
  ) {
    // Use repository for question lookup
    const question = await this.questionRepository.findByIdWithDetails(questionId);

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

    // Create performance record using repository
    const performance = await this.userQuestionPerformanceRepository.createPerformance({
      userId,
      questionId,
      deliveryMethod: attemptDto.deliveryMethod,
      score: attemptDto.score,
      timeToComplete: attemptDto.timeToComplete ?? 0,
      percentageAccuracy: attemptDto.percentageAccuracy,
      attempts: attemptDto.attempts,
      lastRevisedAt: now,
      nextReviewDue: srsState.nextReviewDue,
      intervalDays: srsState.intervalDays,
      stability: srsState.stability ?? 0,
      difficulty: srsState.difficulty ?? 0,
      repetitions: srsState.repetitions,
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
   * Uses repository for DIP compliance.
   */
  async getDueReviews(userId: string) {
    const now = new Date();

    return this.userQuestionPerformanceRepository.findManyByUserWithQuestion(
      userId,
      {
        where: {
          nextReviewDue: {
            lte: now,
            not: null,
          },
        },
      },
    );
  }

  /**
   * Get count of due reviews using latest performance per question.
   * Delegates to UserQuestionPerformanceRepository for DRY compliance.
   */
  async getDueReviewCount(
    userId: string,
    dueCutoff?: Date,
  ): Promise<number> {
    const cutoff = dueCutoff || getEndOfLocalDayUtc(new Date(), 0);
    return this.userQuestionPerformanceRepository.countDueReviewsLatestPerQuestion(
      userId,
      cutoff,
    );
  }

  /**
   * Get due reviews using latest performance per question (not all historical records).
   * Uses repository's groupLatestByQuestion for DIP compliance.
   */
  async getDueReviewsLatest(userId: string) {
    const now = new Date();

    // Get latest performance per question using repository
    const performances = await this.userQuestionPerformanceRepository.groupLatestByQuestion(userId);

    if (performances.length === 0) {
      return [];
    }

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
   * Uses repository for DIP compliance.
   */
  async getRecentAttempts(userId: string, limit: number = 20) {
    return this.userQuestionPerformanceRepository.findRecentByUser(userId, limit);
  }
}
