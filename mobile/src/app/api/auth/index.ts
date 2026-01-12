import type { Session, User } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/app/api/supabase/client';
import {
  resolvePostAuthDestination,
  resolvePostLoginDestination,
} from '@/features/auth/flows/resolvePostAuthDestination';
import { getSupabaseRedirectUrl } from '@/services/env/supabaseConfig';

type SignUpResult = { user: User | null; session: Session | null };

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

export async function signUpWithEmail(
  name: string | null,
  email: string,
  password: string,
): Promise<SignUpResult> {
  const supabase = getSupabaseClient();
  const redirectUrl = getSupabaseRedirectUrl();
  console.log('signUpWithEmail: Starting sign-up', { email, redirectUrl, hasName: !!name });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('signUpWithEmail: Supabase error', {
      error,
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  console.log('signUpWithEmail: Sign-up successful', {
    hasUser: !!data.user,
    hasSession: !!data.session,
    userEmail: data.user?.email,
    emailConfirmed: data.user?.email_confirmed_at ? 'yes' : 'no',
  });

  return {
    user: data.user ?? null,
    session: data.session ?? null,
  };
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// OPTIONAL: forgot password (email reset)
export async function resendConfirmationEmail(email: string) {
  const supabase = getSupabaseClient();
  const redirectUrl = getSupabaseRedirectUrl();
  console.log('resendConfirmationEmail: Resending confirmation email', { email, redirectUrl });
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  if (error) {
    console.error('resendConfirmationEmail: Error', {
      error,
      code: error.code,
      message: error.message,
    });
    throw error;
  }
  console.log('resendConfirmationEmail: Email resent successfully');
  return data;
}

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

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getSession() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function setSessionFromEmailLink(accessToken: string, refreshToken: string) {
  const supabase = getSupabaseClient();
  const { error, data } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return data.session ?? null;
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailPassword(email, password);
  return user ?? null;
}

export { resolvePostAuthDestination, resolvePostLoginDestination };
