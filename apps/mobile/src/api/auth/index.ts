import { getSupabaseClient } from '@/api/supabase/client';

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// OPTIONAL: forgot password (email reset)
export async function sendPasswordReset(email: string, redirectTo?: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}
