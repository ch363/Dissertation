// Polyfills for React Native environment (URL, crypto.getRandomValues)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { readSupabaseEnv, SupabaseConfigError, type SupabaseEnvConfig } from './config';

export { SupabaseConfigError } from './config';

type SupabaseConfigState =
  | { status: 'pending' }
  | { status: 'ready'; config: SupabaseEnvConfig }
  | { status: 'error'; message: string; missing: string[] };

let clientSingleton: SupabaseClient | null = null;
let configState: SupabaseConfigState = { status: 'pending' };
let appStateSubscription: { remove: () => void } | null = null;

export function getSupabaseConfigStatus(): SupabaseConfigState {
  return configState;
}

export function initSupabaseClient(overrides?: Partial<SupabaseEnvConfig>): SupabaseClient {
  if (clientSingleton) return clientSingleton;

  const config = readSupabaseEnv(overrides);
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
