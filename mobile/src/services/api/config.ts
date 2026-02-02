import Constants from 'expo-constants';

interface ExpoExtra {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_BACKEND_URL?: string;
  apiUrl?: string;
  [key: string]: unknown;
}

function readExtra(): ExpoExtra {
  return (
    (Constants?.expoConfig?.extra as ExpoExtra | undefined) ||
    (Constants?.manifest?.extra as ExpoExtra | undefined) ||
    {}
  );
}

function resolveApiUrl(extra: ExpoExtra, override?: string): string {
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
