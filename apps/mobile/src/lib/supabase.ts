// Polyfills for React Native environment (URL, crypto.getRandomValues)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

type SupabaseEnvConfig = { url: string; anonKey: string };

type SupabaseConfigState =
  | { status: 'pending' }
  | { status: 'ready'; config: SupabaseEnvConfig }
  | { status: 'error'; message: string; missing: string[] };

export class SupabaseConfigError extends Error {
  missing: string[];
  constructor(message: string, missing: string[]) {
    super(message);
    this.name = 'SupabaseConfigError';
    this.missing = missing;
  }
}

let clientSingleton: SupabaseClient | null = null;
let configState: SupabaseConfigState = { status: 'pending' };
let appStateSubscription: { remove: () => void } | null = null;

function readEnvConfig(
  overrides?: Partial<SupabaseEnvConfig>
): SupabaseEnvConfig | SupabaseConfigError {
  const extra =
    (Constants?.expoConfig?.extra as Record<string, any> | undefined) ||
    ((Constants as any)?.manifest?.extra as Record<string, any> | undefined) ||
    {};

  const url =
    overrides?.url ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
    (extra?.supabaseUrl as string | undefined) ||
    '';

  const anonKey =
    overrides?.anonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (extra?.supabaseAnonKey as string | undefined) ||
    '';

  const missing: string[] = [];
  if (!url) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return new SupabaseConfigError('Missing Supabase config', missing);
  }
  return { url, anonKey };
}

export function getSupabaseConfigStatus(): SupabaseConfigState {
  return configState;
}

export function initSupabaseClient(overrides?: Partial<SupabaseEnvConfig>): SupabaseClient {
  if (clientSingleton) return clientSingleton;

  const config = readEnvConfig(overrides);
  if (config instanceof SupabaseConfigError) {
    configState = { status: 'error', message: config.message, missing: config.missing };
    throw config;
  }

  clientSingleton = createClient(config.url, config.anonKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  configState = { status: 'ready', config };

  if (Platform.OS !== 'web' && !appStateSubscription) {
    // Keep auth token fresh while app is foregrounded
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (!clientSingleton) return;
      if (state === 'active') clientSingleton.auth.startAutoRefresh();
      else clientSingleton.auth.stopAutoRefresh();
    });
  }

  return clientSingleton;
}

export function getSupabaseClient(overrides?: Partial<SupabaseEnvConfig>): SupabaseClient {
  return initSupabaseClient(overrides);
}
