import { Injectable } from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { QuestionAttemptService } from './question-attempt.service';
import { AnswerValidationService } from './answer-validation.service';
import { ProgressSummaryService } from './progress-summary.service';
import { DeliveryMethodScoreService } from './delivery-method-score.service';
import { ProgressResetService } from './progress-reset.service';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { ValidatePronunciationDto } from './dto/validate-pronunciation.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger';

/**
 * ProgressService (Facade)
 * 
 * Facade pattern implementation that delegates to focused services.
 * Maintains backward compatibility with existing controllers while
 * following SOLID principles internally.
 * 
 * This demonstrates:
 * - Single Responsibility: Each service has one focused domain
 * - Open/Closed: New functionality added via new services, not modifying existing ones
 * - Dependency Inversion: High-level facade depends on abstractions (services)
 */
@Injectable()
export class ProgressService {
  private readonly logger = new LoggerService(ProgressService.name);

  constructor(
    private lessonProgress: LessonProgressService,
    private questionAttempt: QuestionAttemptService,
    private answerValidation: AnswerValidationService,
    private progressSummary: ProgressSummaryService,
    private deliveryMethodScore: DeliveryMethodScoreService,
    private progressReset: ProgressResetService,
    private prisma: PrismaService,
  ) {}

  // Lesson Progress methods - delegate to LessonProgressService
  async startLesson(userId: string, lessonId: string) {
    return this.lessonProgress.startLesson(userId, lessonId);
  }

  async endLesson(userId: string, lessonId: string) {
    return this.lessonProgress.endLesson(userId, lessonId);
  }

  async getUserLessons(userId: string, tzOffsetMinutes?: number) {
    return this.lessonProgress.getUserLessons(userId, tzOffsetMinutes);
  }

  async completeTeaching(
    userId: string,
    teachingId: string,
    timeSpentMs?: number,
  ) {
    return this.lessonProgress.completeTeaching(userId, teachingId, timeSpentMs);
  }

  async markModuleCompleted(userId: string, moduleIdOrSlug: string) {
    return this.lessonProgress.markModuleCompleted(userId, moduleIdOrSlug);
  }

  // Question Attempt methods - delegate to QuestionAttemptService
  async recordQuestionAttempt(
    userId: string,
    questionId: string,
    attemptDto: QuestionAttemptDto,
  ) {
    return this.questionAttempt.recordQuestionAttempt(
      userId,
      questionId,
      attemptDto,
    );
  }

  async getDueReviews(userId: string) {
    return this.questionAttempt.getDueReviews(userId);
  }

  async getDueReviewCount(userId: string, dueCutoff?: Date) {
    return this.questionAttempt.getDueReviewCount(userId, dueCutoff);
  }

  async getDueReviewsLatest(userId: string) {
    return this.questionAttempt.getDueReviewsLatest(userId);
  }

  async getRecentAttempts(userId: string, limit?: number) {
    return this.questionAttempt.getRecentAttempts(userId, limit);
  }

  // Answer Validation methods - delegate to AnswerValidationService
  async validateAnswer(
    userId: string,
    questionId: string,
    dto: ValidateAnswerDto,
  ) {
    return this.answerValidation.validateAnswer(userId, questionId, dto);
  }

  async validatePronunciation(
    userId: string,
    questionId: string,
    dto: ValidatePronunciationDto,
  ) {
    return this.answerValidation.validatePronunciation(userId, questionId, dto);
  }

  // Progress Summary methods - delegate to ProgressSummaryService
  async getProgressSummary(userId: string, tzOffsetMinutes?: number) {
    return this.progressSummary.getProgressSummary(userId, tzOffsetMinutes);
  }

  async calculateStreak(userId: string) {
    return this.progressSummary.calculateStreak(userId);
  }

  // Delivery Method Score methods - delegate to DeliveryMethodScoreService
  async updateDeliveryMethodScore(
    userId: string,
    method: DELIVERY_METHOD,
    dto: DeliveryMethodScoreDto,
  ) {
    return this.deliveryMethodScore.updateDeliveryMethodScore(
      userId,
      method,
      dto,
    );
  }

  // Progress Reset methods - delegate to ProgressResetService
  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.progressReset.resetAllProgress(userId, options);
  }

  async resetLessonProgress(userId: string, lessonId: string) {
    return this.progressReset.resetLessonProgress(userId, lessonId);
  }

  async resetQuestionProgress(userId: string, questionId: string) {
    return this.progressReset.resetQuestionProgress(userId, questionId);
  }

  // Knowledge Level Progress - simple method kept in facade
  async recordKnowledgeLevelProgress(
    userId: string,
    progressDto: KnowledgeLevelProgressDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgePoints: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const newTotal = user.knowledgePoints + progressDto.value;

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
          knowledgePoints: newTotal,
        },
      });

      this.logger.logInfo('Knowledge level progress recorded', {
        userId,
        addedXp: progressDto.value,
        newTotal,
      });

      return {
        knowledgePoints: updatedUser.knowledgePoints,
        lastProgressRow: progressRow,
      };
    });
  }
}
