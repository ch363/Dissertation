// Polyfills for React Native environment (URL, crypto.getRandomValues)
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Resolve config from ENV or Expo extra
const extra =
  ((Constants as any)?.expoConfig?.extra as any) ||
  ((Constants as any)?.manifest?.extra as any) ||
  ((Constants as any)?.manifest2?.extra as any) ||
  {};
const SUPABASE_URL =
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  (extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  (extra?.supabaseUrl as string | undefined);

const SUPABASE_ANON_KEY =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (extra?.supabaseAnonKey as string | undefined);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env or app.json extra.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Use implicit flow to avoid WebCrypto requirement in RN
    flowType: 'implicit',
    detectSessionInUrl: false,
  },
});

export async function saveOnboarding(name: string, answers: any) {
  const { error } = await supabase.rpc('upsert_onboarding', {
    p_name: name,
    p_answers: answers,
  });
  if (error) throw error;
}

export async function fetchDueItems(limit = 30) {
  const { data, error } = await supabase.rpc('get_due_items', { limit_count: limit });
  if (error) throw error;
  return data; // array of items
}
