import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { getSupabaseClient } from '@/services/supabase/client';
import { getSupabaseRedirectUrl } from '@/services/env/supabaseConfig';
import { apiClient } from './client';
import { routes } from '@/services/navigation/routes';

type SignUpResult = { user: User | null; session: Session | null };

/**
 * Sign in with email and password
 */
export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<{ session: Session | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { session: data.session };
}

/**
 * Sign up with email and password
 */
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

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string, redirectUrl?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl || getSupabaseRedirectUrl(),
  });
  if (error) throw error;
}

/**
 * Resend confirmation email
 */
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

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<{ user: User | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return { user: data.user };
}

/**
 * Set session from email link (for email confirmation and password reset)
 */
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

/**
 * Resolve post-authentication destination
 * Checks onboarding status and routes accordingly
 */
export async function resolvePostAuthDestination(userId: string): Promise<string> {
  try {
    // Ensure profile exists via backend
    await apiClient.post('/me/profile/ensure');
    
    // Check if user has completed onboarding via backend
    const hasOnboarding = await apiClient.get<{ hasOnboarding: boolean }>('/onboarding/has');
    
    console.log('resolvePostAuthDestination:', { userId, hasOnboarding: hasOnboarding.hasOnboarding });
    
    // Users who completed onboarding should go to home
    if (hasOnboarding.hasOnboarding) {
      return routes.tabs.home;
    }
    
    // For first-time users, go to home (app/index) - they can start onboarding from there
    return routes.tabs.home;
  } catch (err) {
    // If there's an error, default to home page
    console.error('resolvePostAuthDestination: Error', err);
    return routes.tabs.home;
  }
}

/**
 * Resolve post-login destination
 * Always routes to home, skipping onboarding check
 */
export async function resolvePostLoginDestination(_userId: string): Promise<string> {
  try {
    // Ensure profile exists via backend
    await apiClient.post('/me/profile/ensure');
    // Login always goes to home - existing users should not see onboarding again
    return routes.tabs.home;
  } catch (err) {
    // If there's an error, default to home
    console.error('resolvePostLoginDestination: Error', err);
    return routes.tabs.home;
  }
}
