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
