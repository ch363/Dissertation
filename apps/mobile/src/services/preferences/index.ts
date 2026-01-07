import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ttsEnabled: '@prefs/ttsEnabled',
  ttsRate: '@prefs/ttsRate',
  adaptivity: '@prefs/adaptivity',
  notifications: '@prefs/notifications',
} as const;

export async function getTtsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ttsEnabled);
    if (raw === null) return true; // default ON
    return raw === 'true';
  } catch {
    return true;
  }
}

export async function setTtsEnabled(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ttsEnabled, String(value));
  } catch {}
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Default rate tuned for natural pace
const DEFAULT_RATE = 0.95;

export async function getTtsRate(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ttsRate);
    if (!raw) return DEFAULT_RATE;
    const n = Number(raw);
    if (Number.isNaN(n)) return DEFAULT_RATE;
    return clamp(n, 0.5, 1.0);
  } catch {
    return DEFAULT_RATE;
  }
}

export async function setTtsRate(rate: number): Promise<void> {
  try {
    const clamped = clamp(rate, 0.5, 1.0);
    await AsyncStorage.setItem(KEYS.ttsRate, String(clamped));
  } catch {}
}

// Adaptivity (learning adjustments)
export async function getAdaptivityEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.adaptivity);
    if (raw === null) return true; // default ON
    return raw === 'true';
  } catch {
    return true;
  }
}

export async function setAdaptivityEnabled(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.adaptivity, String(value));
  } catch {}
}

// Notifications preference (local flag only; not OS-level permissions)
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.notifications);
    if (raw === null) return true; // default ON
    return raw === 'true';
  } catch {
    return true;
  }
}

export async function setNotificationsEnabled(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.notifications, String(value));
  } catch {}
}
