import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fluentia:completed-modules:v1';

export async function getCompletedModules(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr.filter((x) => typeof x === 'string') as string[]) : [];
  } catch {
    return [];
  }
}

export async function markModuleCompleted(slug: string): Promise<void> {
  const current = await getCompletedModules();
  if (current.includes(slug)) return;
  const next = [...current, slug];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// --- Compact progress summary used by UI ---
export type ProgressSummary = {
  xp: number;
  streak: number;
  level?: number;
  updatedAt: number;
};

/**
 * Calculates a simple progress snapshot. This is a lightweight placeholder
 * implementation that derives XP from the count of completed modules.
 * Replace with a real repo (e.g., Supabase aggregation) when available.
 */
export async function getProgressSummary(_userId: string): Promise<ProgressSummary> {
  // Using local completed modules as a proxy for XP for now
  const completed = await getCompletedModules();
  const xp = completed.length * 20; // 20 XP per completed module (placeholder)
  // Streak and level are placeholders; wire to real data later
  const streak = Math.max(0, Math.min(365, completed.length));
  const level = Math.floor(xp / 100) + 1;
  return { xp, streak, level, updatedAt: Date.now() };
}
