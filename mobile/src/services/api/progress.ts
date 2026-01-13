import { apiClient } from './client';

export interface QuestionAttemptDto {
  score: number;
  timeToComplete?: number;
  percentageAccuracy?: number;
  attempts?: number;
}

export interface DeliveryMethodScoreDto {
  score: number;
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
  return apiClient.get<UserLessonProgress[]>('/progress/lessons');
}

/**
 * Mark teaching as completed
 */
export async function completeTeaching(teachingId: string) {
  return apiClient.post(`/progress/teachings/${teachingId}/complete`);
}

/**
 * Record question attempt
 */
export async function recordQuestionAttempt(
  questionId: string,
  attempt: QuestionAttemptDto,
) {
  return apiClient.post(`/progress/questions/${questionId}/attempt`, attempt);
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
export async function getDueReviewsLatest(): Promise<DueReview[]> {
  return apiClient.get<DueReview[]>('/progress/reviews/due/latest');
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
