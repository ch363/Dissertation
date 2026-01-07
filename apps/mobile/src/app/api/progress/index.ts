import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabaseClient } from '@/app/api/supabase/client';
import { logError } from '@/services/logging/logger';

const CACHE_KEY = 'fluentia:progress:v2';
const CACHE_VERSION = 2;
const TABLE = 'user_progress';

type ProgressRecord = {
  completed: string[];
  updatedAt: number;
  version: number;
};

type RemoteRecord = {
  completed: string[] | null;
  updated_at: string | null;
  version: number | null;
};

async function readCache(): Promise<ProgressRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const completed = Array.isArray(parsed.completed)
      ? (parsed.completed.filter((x: unknown) => typeof x === 'string') as string[])
      : [];
    const updatedAt =
      typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : 0;
    const version = typeof parsed.version === 'number' ? parsed.version : 0;
    return { completed, updatedAt, version };
  } catch {
    return null;
  }
}

async function writeCache(record: ProgressRecord) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(record));
  } catch {
    // ignore cache write failures
  }
}

function mergeProgress(localRec: ProgressRecord | null, remoteRec: RemoteRecord | null) {
  const normalize = (rec: ProgressRecord | RemoteRecord | null): ProgressRecord | null => {
    if (!rec) return null;
    const completed = Array.isArray((rec as any).completed)
      ? ((rec as any).completed.filter((x: unknown) => typeof x === 'string') as string[])
      : [];
    const updatedAtVal =
      (rec as any).updatedAt ??
      (rec as any).updated_at ??
      (rec as any).updatedAt ??
      (rec as any).updated_at;
    let updatedAt = 0;
    if (typeof updatedAtVal === 'number') {
      updatedAt = updatedAtVal;
    } else if (typeof updatedAtVal === 'string') {
      updatedAt = Date.parse(updatedAtVal);
    }
    const version = typeof (rec as any).version === 'number' ? (rec as any).version : 0;
    return { completed, updatedAt, version };
  };
  const local = normalize(localRec);
  const remote = normalize(remoteRec);

  if (!local && !remote) return { completed: [], updatedAt: 0, version: 0 };
  if (local && !remote) return local;
  if (remote && !local) return remote;
  // choose latest by updatedAt, then by version, else prefer remote
  if ((remote!.updatedAt ?? 0) > (local!.updatedAt ?? 0)) return remote!;
  if ((remote!.updatedAt ?? 0) < (local!.updatedAt ?? 0)) return local!;
  if ((remote!.version ?? 0) >= (local!.version ?? 0)) return remote!;
  return local!;
}

async function fetchRemote(userId: string): Promise<RemoteRecord | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('completed, updated_at, version')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && (error as any).code !== 'PGRST116') throw error;
  return (data as RemoteRecord | null) ?? null;
}

async function pushRemote(userId: string, record: ProgressRecord) {
  try {
    const supabase = getSupabaseClient();
    await supabase
      .from(TABLE)
      .upsert({
        user_id: userId,
        completed: record.completed,
        updated_at: new Date(record.updatedAt).toISOString(),
        version: record.version,
      })
      .select('user_id')
      .single();
  } catch (error) {
    logError(error, { scope: 'progress.pushRemote' });
  }
}

async function resolveProgress(userId?: string | null): Promise<ProgressRecord> {
  const cache = await readCache();
  if (!userId) return cache ?? { completed: [], updatedAt: 0, version: CACHE_VERSION };

  try {
    const remote = await fetchRemote(userId);
    const merged = mergeProgress(cache, remote);
    // if remote differs from cache, sync in appropriate direction
    const remoteCompleted = remote?.completed ?? [];
    if (cache && remote && cache.completed.join('|') !== remoteCompleted.join('|')) {
      // cache wins on merge; push to remote
      pushRemote(userId, merged);
    } else if (!remote && cache) {
      // no remote row yet; create it
      pushRemote(userId, merged);
    } else if (remote && remoteCompleted.join('|') !== merged.completed.join('|')) {
      await writeCache(merged);
    }
    return merged;
  } catch (error) {
    logError(error, { scope: 'progress.resolve', userId });
    return cache ?? { completed: [], updatedAt: 0, version: CACHE_VERSION };
  }
}

export async function getCompletedModules(userId?: string | null): Promise<string[]> {
  const resolved = await resolveProgress(userId);
  return resolved.completed;
}

export async function markModuleCompleted(slug: string, userId?: string | null): Promise<void> {
  const current = await resolveProgress(userId);
  if (current.completed.includes(slug)) return;
  const next: ProgressRecord = {
    completed: [...current.completed, slug],
    updatedAt: Date.now(),
    version: current.version + 1,
  };
  await writeCache(next);
  if (userId) pushRemote(userId, next);
}

export async function resetProgress(userId?: string | null): Promise<void> {
  const cleared: ProgressRecord = { completed: [], updatedAt: Date.now(), version: CACHE_VERSION };
  await writeCache(cleared);
  if (userId) pushRemote(userId, cleared);
}

// --- Compact progress summary used by UI ---
export type ProgressSummary = {
  xp: number;
  streak: number;
  level?: number;
  updatedAt: number;
};

/**
 * Calculates a progress snapshot. XP derived from completed modules.
 * Streak/level remain placeholders until real server aggregation exists.
 */
export async function getProgressSummary(userId: string | null): Promise<ProgressSummary> {
  const completed = await getCompletedModules(userId ?? undefined);
  const xp = completed.length * 20;
  const streak = Math.max(0, Math.min(365, completed.length));
  const level = Math.floor(xp / 100) + 1;
  return { xp, streak, level, updatedAt: Date.now() };
}
