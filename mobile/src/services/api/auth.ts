import type { Session, User } from '@supabase/supabase-js';

import { apiClient } from './client';
import { ensureProfileSeed } from './profile';

import { getSupabaseRedirectUrl } from '@/services/env/supabaseConfig';
import { createLogger } from '@/services/logging';
import { routes } from '@/services/navigation/routes';
import { getSupabaseClient } from '@/services/supabase/client';

const Logger = createLogger('AuthAPI');

type SignUpResult = { user: User | null; session: Session | null };

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<{ session: Session | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { session: data.session };
}

export async function signUpWithEmail(
  name: string | null,
  email: string,
  password: string,
): Promise<SignUpResult> {
  const supabase = getSupabaseClient();
  const redirectUrl = getSupabaseRedirectUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function sendPasswordReset(email: string, redirectUrl?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl || getSupabaseRedirectUrl(),
  });
  if (error) throw error;
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getSupabaseRedirectUrl(),
    },
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<{ user: User | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return { user: data.user };
}

export async function setSessionFromEmailLink(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  if (!data.session) {
    throw new Error('Failed to set session from email link');
  }
}

export async function resolvePostAuthDestination(userId: string): Promise<string> {
  try {
    await ensureProfileSeed();

    const hasOnboarding = await apiClient.get<{ hasOnboarding: boolean }>('/onboarding/has');

    Logger.info('resolvePostAuthDestination', {
      userId,
      hasOnboarding: hasOnboarding.hasOnboarding,
    });

    if (hasOnboarding.hasOnboarding) {
      return routes.tabs.home;
    }

    return routes.onboarding.welcome;
  } catch (err) {
    Logger.error('resolvePostAuthDestination: Error', err);
    return routes.onboarding.welcome;
  }
}

export async function resolvePostLoginDestination(_userId: string): Promise<string> {
  try {
    await ensureProfileSeed();
    return routes.tabs.home;
  } catch (err) {
    Logger.error('resolvePostLoginDestination: Error', err);
    return routes.tabs.home;
  }
}
