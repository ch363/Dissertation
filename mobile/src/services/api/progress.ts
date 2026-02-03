import { apiClient } from './client';
import { ApiClientError } from './types';
import type { DeliveryMethod } from '@/features/session/delivery-methods';

const VALIDATE_ANSWER_RETRY_DELAY_MS = 1000;

function isNetworkError(e: unknown): boolean {
  if (!(e instanceof ApiClientError)) return false;
  const m = e.message.toLowerCase();
  return (
    m.includes('network') ||
    m.includes('reachable') ||
    m.includes('failed to fetch') ||
    m.includes('timeout')
  );
}

export interface QuestionAttemptDto {
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

export async function startLesson(lessonId: string) {
  return apiClient.post(`/progress/lessons/${lessonId}/start`);
}

export async function endLesson(lessonId: string) {
  return apiClient.post(`/progress/lessons/${lessonId}/end`);
}

export async function getUserLessons(): Promise<UserLessonProgress[]> {
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  const params = new URLSearchParams();
  if (Number.isFinite(tzOffsetMinutes)) {
    params.append('tzOffsetMinutes', String(tzOffsetMinutes));
  }
  const query = params.toString();
  return apiClient.get<UserLessonProgress[]>(`/progress/lessons${query ? `?${query}` : ''}`);
}

export async function completeTeaching(
  teachingId: string,
  timeSpentMs?: number,
) {
  return apiClient.post(`/progress/teachings/${teachingId}/complete`, {
    ...(timeSpentMs != null && timeSpentMs > 0 ? { timeSpentMs } : {}),
  });
}

export interface QuestionAttemptResponse {
  awardedXp: number;
  [key: string]: any;
}

export async function recordQuestionAttempt(
  questionId: string,
  attempt: QuestionAttemptDto,
): Promise<QuestionAttemptResponse> {
  return apiClient.post<QuestionAttemptResponse>(`/progress/questions/${questionId}/attempt`, attempt);
}

export async function getDueReviews(): Promise<DueReview[]> {
  return apiClient.get<DueReview[]>('/progress/reviews/due');
}

export async function getDueReviewsLatest(): Promise<DueReviewLatest[]> {
  return apiClient.get<DueReviewLatest[]>('/progress/reviews/due/latest');
}

export async function updateDeliveryMethodScore(
  method: string,
  score: DeliveryMethodScoreDto,
) {
  return apiClient.post(`/progress/delivery-method/${method}/score`, score);
}

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

export async function getProgressSummary(_userId: string | null): Promise<ProgressSummary> {
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  const params = new URLSearchParams();
  if (Number.isFinite(tzOffsetMinutes)) {
    params.append('tzOffsetMinutes', String(tzOffsetMinutes));
  }
  const query = params.toString();
  return apiClient.get<ProgressSummary>(`/progress/summary${query ? `?${query}` : ''}`);
}

export async function markModuleCompleted(moduleIdOrSlug: string): Promise<void> {
  await apiClient.post(`/progress/modules/${encodeURIComponent(moduleIdOrSlug)}/complete`);
}

export interface ValidateAnswerResponse {
  isCorrect: boolean;
  score: number;
  feedback?: string;
  /** Grammatical correctness 0–100 for text-input answers. */
  grammaticalCorrectness?: number;
  /** True when the answer is meaning-correct but less natural (e.g. acceptable alternative). */
  meaningCorrect?: boolean;
  /** Preferred natural phrasing to show when meaningCorrect is true. */
  naturalPhrasing?: string;
  /** Optional explanation for why the natural phrasing is preferred. */
  feedbackWhy?: string;
  /** Other accepted forms to show after submit (e.g. alternative phrasings). */
  acceptedVariants?: string[];
}

import type { PronunciationWordResult } from '@/types/session';

export type { PronunciationWordResult } from '@/types/session';

export interface PronunciationResponse {
  overallScore: number;
  transcription: string;
  words: PronunciationWordResult[];
  isCorrect: boolean;
  score: number;
}

export async function validateAnswer(
  questionId: string,
  answer: string,
  deliveryMethod: DeliveryMethod,
): Promise<ValidateAnswerResponse> {
  const attempt = async (): Promise<ValidateAnswerResponse> =>
    apiClient.post<ValidateAnswerResponse>(
      `/progress/questions/${questionId}/validate`,
      { answer, deliveryMethod },
    );
  try {
    return await attempt();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    await new Promise((r) => setTimeout(r, VALIDATE_ANSWER_RETRY_DELAY_MS));
    return attempt();
  }
}

/** Timeout for pronunciation validation (ML processing can take longer than default). */
const PRONUNCIATION_TIMEOUT_MS = 60_000;

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
    { timeoutMs: PRONUNCIATION_TIMEOUT_MS },
  );
}