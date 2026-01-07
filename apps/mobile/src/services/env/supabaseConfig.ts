import Constants from 'expo-constants';

export type SupabaseEnvConfig = { url: string; anonKey: string };

export class SupabaseConfigError extends Error {
  missing: string[];
  constructor(message: string, missing: string[]) {
    super(message);
    this.name = 'SupabaseConfigError';
    this.missing = missing;
  }
}

function readExtra(): Record<string, any> {
  return (
    (Constants?.expoConfig?.extra as Record<string, any> | undefined) ||
    ((Constants as any)?.manifest?.extra as Record<string, any> | undefined) ||
    {}
  );
}

function resolveSupabaseUrl(extra: Record<string, any>, override?: string) {
  return (
    override ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
    (extra?.supabaseUrl as string | undefined) ||
    ''
  );
}

function resolveSupabaseAnonKey(extra: Record<string, any>, override?: string) {
  return (
    override ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (extra?.supabaseAnonKey as string | undefined) ||
    ''
  );
}

export function readSupabaseEnv(
  overrides?: Partial<SupabaseEnvConfig>
): SupabaseEnvConfig | SupabaseConfigError {
  const extra = readExtra();

  const url = resolveSupabaseUrl(extra, overrides?.url);
  const anonKey = resolveSupabaseAnonKey(extra, overrides?.anonKey);

  const missing: string[] = [];
  if (!url) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return new SupabaseConfigError('Missing Supabase config', missing);
  }

  return { url, anonKey };
}

export function getSupabaseRedirectUrl(override?: string) {
  const extra = readExtra();
  return (
    override ||
    process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
    (extra?.EXPO_PUBLIC_SUPABASE_REDIRECT_URL as string | undefined) ||
    (extra?.supabaseRedirectUrl as string | undefined) ||
    'fluentia://sign-in'
  );
}
