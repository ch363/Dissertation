import { apiClient } from '@/services/api/client';
import {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
} from '@/features/onboarding/utils/mapper';
import {
  ONBOARDING_SCHEMA_VERSION,
  parseOnboardingSubmission,
  type OnboardingAnswers,
  type OnboardingSubmission,
} from '@/types/onboarding';

export type Profile = {
  id: string; // user id
  name?: string | null;
};

export async function upsertProfile(userId: string, name?: string) {
  // This function is kept for compatibility but profile management is now via /me endpoints
  await apiClient.post('/me/profile/ensure', { name });
}

export async function saveOnboarding(userId: string, answers: OnboardingAnswers) {
  const submission = buildOnboardingSubmission(answers);
  try {
    const response = await apiClient.post<any>('/onboarding', { answers: submission });
    console.log('saveOnboarding: Successfully saved onboarding for user', userId, { response });
    
    // Verify the save was successful by checking if we can retrieve it
    // This ensures the backend has processed the save
    try {
      const verifyResponse = await apiClient.get<{ hasOnboarding: boolean }>('/onboarding/has');
      const hasOnboarding = (verifyResponse as any)?.data?.hasOnboarding ?? (verifyResponse as any)?.hasOnboarding ?? false;
      if (!hasOnboarding) {
        console.warn('saveOnboarding: Save verification failed - hasOnboarding still false');
      }
    } catch (verifyError) {
      console.warn('saveOnboarding: Could not verify save', verifyError);
      // Don't throw - the save might have succeeded even if verification fails
    }
  } catch (error: any) {
    console.error('saveOnboarding: Error saving onboarding', { error, userId, statusCode: error?.statusCode });
    throw error;
  }
}

export async function hasOnboarding(userId: string): Promise<boolean> {
  try {
    const response = await apiClient.get<any>('/onboarding/has');
    
    // The backend returns { hasOnboarding: boolean } which gets wrapped by TransformInterceptor
    // So we need to unwrap it: { success: true, data: { hasOnboarding: boolean } }
    // Or it might be unwrapped already: { hasOnboarding: boolean }
    let hasOnboardingValue = false;
    
    if (response && typeof response === 'object') {
      // Check if it's wrapped: { success: true, data: { hasOnboarding: boolean } }
      if ('data' in response && typeof response.data === 'object' && 'hasOnboarding' in response.data) {
        hasOnboardingValue = response.data.hasOnboarding === true;
      }
      // Check if it's unwrapped: { hasOnboarding: boolean }
      else if ('hasOnboarding' in response) {
        hasOnboardingValue = response.hasOnboarding === true;
      }
    }
    
    console.log('hasOnboarding check:', { userId, hasOnboarding: hasOnboardingValue, response });
    return hasOnboardingValue;
  } catch (err: any) {
    // If it's a 404, user doesn't have onboarding (first time)
    if (err?.statusCode === 404) {
      console.log('hasOnboarding: 404 - user has no onboarding data');
      return false;
    }
    // Catch any unexpected errors and return false to allow navigation to continue
    console.error('hasOnboarding: Unexpected error', { err, userId, statusCode: err?.statusCode });
    return false;
  }
}

export async function getOnboarding(userId: string): Promise<OnboardingAnswers | null> {
  try {
    const response = await apiClient.get<{
      userId: string;
      answers: any;
      createdAt: string;
      updatedAt: string;
    }>('/onboarding');

    if (!response || !response.answers) return null;

    const stored = response.answers;
    if ((stored as any).raw) {
      try {
        const submission = parseOnboardingSubmission(stored);
        return submission.raw;
      } catch {
        return null;
      }
    }
    try {
      return normalizeOnboardingAnswers(stored);
    } catch {
      return null;
    }
  } catch (error: any) {
    // Return null if not found (404) or other errors
    if (error?.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function getOnboardingSubmission(
  userId: string,
): Promise<OnboardingSubmission | null> {
  try {
    const response = await apiClient.get<{
      userId: string;
      answers: any;
      createdAt: string;
      updatedAt: string;
    }>('/onboarding');

    if (!response || !response.answers) return null;

    try {
      return parseOnboardingSubmission(response.answers);
    } catch {
      return null;
    }
  } catch (error: any) {
    // Return null if not found (404) or other errors
    if (error?.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
  ONBOARDING_SCHEMA_VERSION,
  type OnboardingAnswers,
  type OnboardingSubmission,
};
