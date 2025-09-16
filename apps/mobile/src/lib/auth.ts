import { supabase } from './supabase';
import { upsertMyProfile, ensureProfileSeed } from './profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export const PENDING_PROFILE_NAME_KEY = '@pending_profile_name';
export const PENDING_LOGIN_EMAIL_KEY = '@pending_login_email';
export const PENDING_LOGIN_PASSWORD_KEY = '@pending_login_password';

export async function signUpWithEmail(name: string, email: string, password: string) {
  const envRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL as string | undefined;
  const fallbackRedirect = Linking.createURL('auth/callback');
  // On native, always use app deep link to avoid localhost/https issues from env
  const redirectTo = Platform.OS === 'web'
    ? (envRedirect && envRedirect.length > 0 ? envRedirect : fallbackRedirect)
    : fallbackRedirect;
  // Persist minimal creds for dev bypass on verify screen (cleared after sign-in)
  await AsyncStorage.multiSet([
    [PENDING_PROFILE_NAME_KEY, name ?? ''],
    [PENDING_LOGIN_EMAIL_KEY, email ?? ''],
    [PENDING_LOGIN_PASSWORD_KEY, password ?? ''],
  ]);
  // Save name so we can seed profile after email verification completes
  await AsyncStorage.setItem(PENDING_PROFILE_NAME_KEY, name ?? '');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: redirectTo },
  });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    // If the user already exists, try to sign in with the provided password
    if (msg.includes('already registered') || msg.includes('already exists')) {
      const { data: sdata, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // Wrong password or blocked user
        throw signInErr;
      }
      try {
        const metaName = (sdata.user?.user_metadata as any)?.name;
        const bestName = (name && name.trim()) || (metaName && String(metaName).trim()) || null;
        await upsertMyProfile({ name: bestName });
        await AsyncStorage.multiRemove([PENDING_PROFILE_NAME_KEY, PENDING_LOGIN_EMAIL_KEY, PENDING_LOGIN_PASSWORD_KEY]);
      } catch {}
      return { user: sdata.user, needsVerification: false };
    }
    throw error;
  }
  // Create or update profile row if session is immediately available
  try {
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user?.id) {
  const metaName = (sess.session.user.user_metadata as any)?.name;
  const bestName = (name && name.trim()) || (metaName && String(metaName).trim()) || null;
  await upsertMyProfile({ name: bestName });
  await AsyncStorage.multiRemove([PENDING_PROFILE_NAME_KEY, PENDING_LOGIN_EMAIL_KEY, PENDING_LOGIN_PASSWORD_KEY]);
    } else {
      // No session yet (e.g., email confirmation required) — skip for now.
    }
  } catch (e) {
    console.warn('profile upsert failed', e);
  }
  // As a safety, try to seed profile later (no-op if not signed in)
  ensureProfileSeed(name).catch(() => {});
  const { data: s2 } = await supabase.auth.getSession();
  const needsVerification = !s2.session; // if no active session, likely waiting for email confirmation
  return { user: data.user, needsVerification };
}

export async function signInWithEmail(email: string, password: string) {
  function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Login timed out. Please check your connection and try again.')), ms);
      p.then((v) => {
        clearTimeout(t);
        resolve(v);
      }).catch((e) => {
        clearTimeout(t);
        reject(e);
      });
    });
  }
  const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
  if (error) throw error;
  return data.user;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// Light wrappers exposed via facade to avoid importing supabase in UI
export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function exchangeCodeForSession(code: string) {
  return supabase.auth.exchangeCodeForSession(code);
}

export async function signOut() {
  await supabase.auth.signOut();
}
