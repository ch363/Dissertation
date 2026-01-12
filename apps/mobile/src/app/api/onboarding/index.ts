import { getSupabaseClient } from '@/app/api/supabase/client';
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
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name }, { onConflict: 'id' });
  if (error) throw error;
}

export async function saveOnboarding(userId: string, answers: OnboardingAnswers) {
  const supabase = getSupabaseClient();
  const submission = buildOnboardingSubmission(answers);
  const payload = { user_id: userId, answers: submission };
  const { data, error } = await supabase
    .from('onboarding_answers')
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id')
    .single();
  if (error) {
    console.error('saveOnboarding: Error saving onboarding', { error, userId });
    throw error;
  }
  console.log('saveOnboarding: Successfully saved onboarding for user', userId, data);
}

export async function hasOnboarding(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('onboarding_answers')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    // PGRST116: No rows found for maybeSingle (expected when no onboarding)
    if (error && error.code !== 'PGRST116') {
      // For other errors (e.g., table doesn't exist, connection issues), log and return false
      // This allows navigation to continue and user can complete onboarding
      console.error('hasOnboarding: Database error', { error, userId, code: error.code });
      return false;
    }

    const hasData = !!data;
    if (!hasData) {
      console.log('hasOnboarding: No onboarding data found for user', userId);
    } else {
      console.log('hasOnboarding: Onboarding data found for user', userId);
    }
    return hasData;
  } catch (err) {
    // Catch any unexpected errors and return false to allow navigation to continue
    console.error('hasOnboarding: Unexpected error', { err, userId });
    return false;
  }
}

export async function getOnboarding(userId: string): Promise<OnboardingAnswers | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('answers')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  const stored = data?.answers as unknown;
  if (!stored) return null;
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
}

export async function getOnboardingSubmission(
  userId: string,
): Promise<OnboardingSubmission | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('answers')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  const stored = data?.answers as unknown;
  if (!stored) return null;
  try {
    return parseOnboardingSubmission(stored);
  } catch {
    return null;
  }
}

export {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
  ONBOARDING_SCHEMA_VERSION,
  type OnboardingAnswers,
  type OnboardingSubmission,
};
