import { supabase } from './supabase';
import type { OnboardingAnswers } from '../onboarding/OnboardingContext';
import { buildOnboardingSubmission, type OnboardingSubmission } from '../onboarding/signals';

export type Profile = {
  id: string; // user id
  name?: string | null;
};

export async function upsertProfile(userId: string, name?: string) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name }, { onConflict: 'id' });
  if (error) throw error;
}

export async function saveOnboarding(userId: string, answers: OnboardingAnswers) {
  const submission = buildOnboardingSubmission(answers);
  const payload = { user_id: userId, answers: submission };
  const { error } = await supabase
    .from('onboarding_answers')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function hasOnboarding(userId: string): Promise<boolean> {
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
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('answers')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  const stored = data?.answers as any;
  if (!stored) return null;
  if (stored.raw) {
    return (stored.raw as OnboardingAnswers) ?? null;
  }
  return stored as OnboardingAnswers;
}

export async function getOnboardingSubmission(
  userId: string
): Promise<OnboardingSubmission | null> {
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('answers')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return (data?.answers as OnboardingSubmission) ?? null;
}
