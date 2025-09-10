import { supabase } from './supabase';
import type { OnboardingAnswers } from '../onboarding/OnboardingContext';

export type Profile = {
  id: string; // user id
  name?: string | null;
};

export async function upsertProfile(userId: string, name?: string) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, name }, { onConflict: 'id' });
  if (error) throw error;
}

export async function saveOnboarding(userId: string, answers: OnboardingAnswers) {
  const payload = {
    user_id: userId,
    answers,
  };
  const { error } = await supabase.from('onboarding_answers').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}
