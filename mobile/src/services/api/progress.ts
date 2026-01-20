import { apiClient } from './client';
import type { DeliveryMethod } from '@/features/session/delivery-methods';

export interface QuestionAttemptDto {
  // Delivery method used for this attempt (used for scoring/personalisation)
  deliveryMethod?: DeliveryMethod | string;
  score: number;
  timeToComplete?: number;
  percentageAccuracy?: number;
  attempts?: number;
}

export interface DeliveryMethodScoreDto {
  delta: number;
}

export interface KnowledgeLevelProgressDto {
  value: number;
}

export interface UserLessonProgress {
  lesson: {
    id: string;
    title: string;
    imageUrl?: string | null;
    module: {
      id: string;
      title: string;
    };
  };
  completedTeachings: number;
  totalTeachings: number;
  dueReviewCount: number;
}

export interface DueReview {
  id: string;
  userId: string;
  questionId: string;
  score: number;
  nextReviewDue: string;
  createdAt: string;
}

export interface DueReviewLatest extends DueReview {
  question?: {
    id: string;
    teaching?: {
      id: string;
      userLanguageString?: string;
      learningLanguageString?: string;
      lesson?: {
        id: string;
        title: string;
        module?: {
          id: string;
          title: string;
        };
      };
    };
  };
}

/**
 * Start or update lesson engagement
 */
export async function startLesson(lessonId: string) {
  return apiClient.post(`/progress/lessons/${lessonId}/start`);
}

/**
 * Get user's lesson progress
 */
export async function getUserLessons(): Promise<UserLessonProgress[]> {
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  const params = new URLSearchParams();
  if (Number.isFinite(tzOffsetMinutes)) {
    params.append('tzOffsetMinutes', String(tzOffsetMinutes));
  }
  const query = params.toString();
  return apiClient.get<UserLessonProgress[]>(`/progress/lessons${query ? `?${query}` : ''}`);
}

/**
 * Mark teaching as completed
 */
export async function completeTeaching(teachingId: string) {
  return apiClient.post(`/progress/teachings/${teachingId}/complete`);
}

export interface QuestionAttemptResponse {
  awardedXp: number;
  [key: string]: any; // Allow other fields from backend response
}

/**
 * Record question attempt
 */
export async function recordQuestionAttempt(
  questionId: string,
  attempt: QuestionAttemptDto,
): Promise<QuestionAttemptResponse> {
  return apiClient.post<QuestionAttemptResponse>(`/progress/questions/${questionId}/attempt`, attempt);
}

/**
 * Get all due reviews
 */
export async function getDueReviews(): Promise<DueReview[]> {
  return apiClient.get<DueReview[]>('/progress/reviews/due');
}

/**
 * Get deduped due reviews (latest per question)
 */
export async function getDueReviewsLatest(): Promise<DueReviewLatest[]> {
  return apiClient.get<DueReviewLatest[]>('/progress/reviews/due/latest');
}

/**
 * Update delivery method preference score
 */
export async function updateDeliveryMethodScore(
  method: string,
  score: DeliveryMethodScoreDto,
) {
  return apiClient.post(`/progress/delivery-method/${method}/score`, score);
}

/**
 * Record XP/knowledge level progress
 */
export async function recordKnowledgeLevelProgress(
  progress: KnowledgeLevelProgressDto,
) {
  return apiClient.post('/progress/knowledge-level-progress', progress);
}

export interface ProgressSummary {
  xp: number;
  streak: number;
  completedLessons: number;
  completedModules: number;
  totalLessons: number;
  totalModules: number;
  dueReviewCount: number;
}

/**
 * Get progress summary for user
 * Returns XP, streak, completed lessons/modules, and due review count
 */
export async function getProgressSummary(userId: string | null): Promise<ProgressSummary> {
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  const params = new URLSearchParams();
  if (Number.isFinite(tzOffsetMinutes)) {
    params.append('tzOffsetMinutes', String(tzOffsetMinutes));
  }
  const query = params.toString();
  return apiClient.get<ProgressSummary>(`/progress/summary${query ? `?${query}` : ''}`);
}

/**
 * Mark module as completed
 * Accepts module ID (UUID) or slug (title)
 */
export async function markModuleCompleted(moduleIdOrSlug: string): Promise<void> {
  await apiClient.post(`/progress/modules/${encodeURIComponent(moduleIdOrSlug)}/complete`);
}

export interface ValidateAnswerResponse {
  isCorrect: boolean;
  score: number;
  feedback?: string;
}

export interface PronunciationResponse {
  overallScore: number;
  transcription: string;
  words: Array<{
    word: string;
    score: number;
    feedback: 'perfect' | 'could_improve';
  }>;
  isCorrect: boolean;
  score: number;
}

/**
 * Validate user answer and get score
 * Returns isCorrect, score, and optional feedback
 */
export async function validateAnswer(
  questionId: string,
  answer: string,
  deliveryMethod: DeliveryMethod,
): Promise<ValidateAnswerResponse> {
  return apiClient.post<ValidateAnswerResponse>(
    `/progress/questions/${questionId}/validate`,
    {
      answer,
      deliveryMethod,
    },
  );
}

/**
 * Validate pronunciation from audio recording
 * Returns pronunciation score, transcription, and word-by-word analysis
 */
export async function validatePronunciation(
  questionId: string,
  audioBase64: string,
  audioFormat: string = 'wav',
): Promise<PronunciationResponse> {
  return apiClient.post<PronunciationResponse>(
    `/progress/questions/${questionId}/pronunciation`,
    {
      audioBase64,
      audioFormat,
    },
  );
}