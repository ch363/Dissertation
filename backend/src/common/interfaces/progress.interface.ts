import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Progress summary response
 */
export interface ProgressSummaryResult {
  currentStreak: number;
  totalXp: number;
  lessonsCompleted: number;
  reviewsDue: number;
  lastActivityDate?: Date;
}

/**
 * Lesson progress record
 */
export interface UserLessonProgress {
  lessonId: string;
  completedTeachings: number;
  totalTeachings: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Question attempt result
 */
export interface QuestionAttemptResult {
  correct: boolean;
  xpEarned: number;
  nextReviewDate?: Date;
}

/**
 * IProgressService Interface
 *
 * Defines the contract for progress tracking operations.
 * Demonstrates Dependency Inversion Principle.
 */
export interface IProgressService {
  // Lesson Progress
  startLesson(userId: string, lessonId: string): Promise<any>;
  endLesson(userId: string, lessonId: string): Promise<any>;
  getUserLessons(userId: string, tzOffsetMinutes?: number): Promise<any>;
  completeTeaching(
    userId: string,
    teachingId: string,
    timeSpentMs?: number,
  ): Promise<any>;
  markModuleCompleted(userId: string, moduleIdOrSlug: string): Promise<any>;

  // Question Attempts
  recordQuestionAttempt(
    userId: string,
    questionId: string,
    attemptDto: any,
  ): Promise<QuestionAttemptResult>;
  getDueReviews(userId: string): Promise<any[]>;
  getDueReviewCount(userId: string, dueCutoff?: Date): Promise<number>;
  getRecentAttempts(userId: string, limit?: number): Promise<any[]>;

  // Answer Validation
  validateAnswer(userId: string, questionId: string, dto: any): Promise<any>;
  validatePronunciation(
    userId: string,
    questionId: string,
    dto: any,
  ): Promise<any>;

  // Progress Summary
  getProgressSummary(
    userId: string,
    tzOffsetMinutes?: number,
  ): Promise<ProgressSummaryResult>;
  calculateStreak(userId: string): Promise<number>;

  // Delivery Method Scores
  updateDeliveryMethodScore(
    userId: string,
    method: DELIVERY_METHOD,
    dto: any,
  ): Promise<any>;

  // Progress Reset
  resetAllProgress(userId: string, options?: any): Promise<any>;
  resetLessonProgress(userId: string, lessonId: string): Promise<any>;
  resetQuestionProgress(userId: string, questionId: string): Promise<any>;
}

/**
 * Injection token for IProgressService
 */
export const PROGRESS_SERVICE = 'IProgressService';
