import Constants from 'expo-constants';

function readExtra(): Record<string, any> {
  return (
    (Constants?.expoConfig?.extra as Record<string, any> | undefined) ||
    ((Constants as any)?.manifest?.extra as Record<string, any> | undefined) ||
    {}
  );
}

function resolveApiUrl(extra: Record<string, any>, override?: string): string {
  return (
    override ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    (extra?.EXPO_PUBLIC_API_URL as string | undefined) ||
    (extra?.EXPO_PUBLIC_BACKEND_URL as string | undefined) ||
    (extra?.apiUrl as string | undefined) ||
    'http://localhost:3000'
  );
}

export function getApiUrl(override?: string): string {
  const extra = readExtra();
  return resolveApiUrl(extra, override);
}
