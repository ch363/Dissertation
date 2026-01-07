import { getSupabaseClient } from '@/api/supabase/client';
import {
  ONBOARDING_SCHEMA_VERSION,
  parseOnboardingSubmission,
  type OnboardingAnswers,
  type OnboardingSubmission,
} from '@/features/onboarding/types/schema';
import {
  buildOnboardingSubmission,
  normalizeOnboardingAnswers,
} from '@/features/onboarding/utils/mapper';

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
  const { error } = await supabase
    .from('onboarding_answers')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function hasOnboarding(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    // PGRST116: No rows found for maybeSingle
    throw error;
  }
  return !!data;
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
  userId: string
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
