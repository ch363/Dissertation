// Polyfills for React Native environment (URL, crypto.getRandomValues)
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, processLock } from '@supabase/supabase-js';

const extra =
  (Constants?.expoConfig?.extra as Record<string, any> | undefined) ||
  ((Constants as any)?.manifest?.extra as Record<string, any> | undefined) ||
  {};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  (extra?.supabaseUrl as string | undefined) ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (extra?.supabaseAnonKey as string | undefined) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set (env or app.json extra).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
