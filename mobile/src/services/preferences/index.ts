import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ttsEnabled: '@prefs/ttsEnabled',
  ttsRate: '@prefs/ttsRate',
  adaptivity: '@prefs/adaptivity',
  notifications: '@prefs/notifications',
  sessionMode: '@prefs/sessionMode',
  sessionTimeBudgetSec: '@prefs/sessionTimeBudgetSec',
  sessionLessonId: '@prefs/sessionLessonId',
} as const;

export type SessionDefaultMode = 'learn' | 'review' | 'mixed';

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

// Session defaults (used for GET /learn/session-plan)
const DEFAULT_SESSION_MODE: SessionDefaultMode = 'mixed';
const MIN_TIME_BUDGET_SEC = 60;

export async function getSessionDefaultMode(): Promise<SessionDefaultMode> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.sessionMode);
    if (raw === 'learn' || raw === 'review' || raw === 'mixed') return raw;
    return DEFAULT_SESSION_MODE;
  } catch {
    return DEFAULT_SESSION_MODE;
  }
}

export async function setSessionDefaultMode(mode: SessionDefaultMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.sessionMode, mode);
  } catch {}
}

export async function getSessionDefaultTimeBudgetSec(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.sessionTimeBudgetSec);
    if (raw === null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (n < MIN_TIME_BUDGET_SEC) return MIN_TIME_BUDGET_SEC;
    return Math.floor(n);
  } catch {
    return null;
  }
}

export async function setSessionDefaultTimeBudgetSec(sec: number | null): Promise<void> {
  try {
    if (sec === null) {
      await AsyncStorage.removeItem(KEYS.sessionTimeBudgetSec);
      return;
    }
    const n = Number(sec);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(MIN_TIME_BUDGET_SEC, Math.floor(n));
    await AsyncStorage.setItem(KEYS.sessionTimeBudgetSec, String(clamped));
  } catch {}
}

export async function getSessionDefaultLessonId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.sessionLessonId);
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function setSessionDefaultLessonId(lessonId: string | null): Promise<void> {
  try {
    if (lessonId === null) {
      await AsyncStorage.removeItem(KEYS.sessionLessonId);
      return;
    }
    const id = String(lessonId).trim();
    if (!id) return;
    await AsyncStorage.setItem(KEYS.sessionLessonId, id);
  } catch {}
}
