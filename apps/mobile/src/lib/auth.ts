import { supabase } from './supabase';

export async function signUpWithEmail(name: string, email: string, password: string) {
  const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL as string | undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
