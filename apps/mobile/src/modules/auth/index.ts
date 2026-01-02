/**
 * Authentication facade — email/password only.
 * Supports optional email confirmation via emailRedirectTo.
 */
import Constants from 'expo-constants';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  sendPasswordReset,
  signInWithEmailPassword,
  signOut as signOutClient,
  signUpWithEmailPassword,
  updatePassword as updatePasswordClient,
} from '@/lib/auth';

type SignUpResult = { user: User | null; session: Session | null };

function getEmailRedirectUrl() {
  const extra =
    (Constants?.expoConfig?.extra as Record<string, any> | undefined) ||
    ((Constants as any)?.manifest?.extra as Record<string, any> | undefined) ||
    {};

  return (
    process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
    (extra?.EXPO_PUBLIC_SUPABASE_REDIRECT_URL as string | undefined) ||
    (extra?.supabaseRedirectUrl as string | undefined) ||
    'fluentia://auth/sign-in'
  );
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailPassword(email, password);
  return user ?? null;
}

export async function signUpWithEmail(
  name: string | null,
  email: string,
  password: string
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: getEmailRedirectUrl(),
    },
  });
  if (error) throw error;
  return {
    user: data.user ?? null,
    session: data.session ?? null,
  };
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function signOut() {
  await signOutClient();
}

export {
  sendPasswordReset,
  updatePasswordClient as updatePassword,
  signInWithEmailPassword,
  signUpWithEmailPassword,
};
