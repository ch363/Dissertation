import { apiClient } from './client';
import { buildTzQueryString, appendQueryString } from './query-builder';

import { cacheAvatarFile, clearCachedAvatar } from '@/services/cache/avatar-cache';
import { readAvatarAsBytes } from '@/services/file/avatar-file-reader';
import { createLogger } from '@/services/logging';
import {
  uploadAvatarToStorage,
  getSignedAvatarUrl,
  getPublicAvatarUrl,
} from '@/services/storage/avatar-storage';
import { getSupabaseClient } from '@/services/supabase/client';

const Logger = createLogger('ProfileAPI');

export interface Profile {
  id: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
}

export type DeliveryMethodType =
  | 'FILL_BLANK'
  | 'FLASHCARD'
  | 'MULTIPLE_CHOICE'
  | 'SPEECH_TO_TEXT'
  | 'TEXT_TO_SPEECH'
  | 'TEXT_TRANSLATION';

export type AccuracyByDeliveryMethod = Partial<Record<DeliveryMethodType, number>>;

export type GrammaticalAccuracyByDeliveryMethod = Partial<Record<DeliveryMethodType, number>>;

export interface DashboardData {
  dueReviewCount: number;
  estimatedReviewMinutes?: number;
  activeLessonCount: number;
  xpTotal: number;
  streak: number | null;
  weeklyXP: number;
  weeklyXPChange: number;
  /** XP per day for current week: [Mon, Tue, Wed, Thu, Fri, Sat, Sun] */
  weeklyActivity?: number[];
  accuracyPercentage: number;
  accuracyByDeliveryMethod?: AccuracyByDeliveryMethod;
  grammaticalAccuracyByDeliveryMethod?: GrammaticalAccuracyByDeliveryMethod;
  studyTimeMinutes: number;
}

export interface StatsData {
  minutesToday: number;
  completedItemsToday: number;
  accuracyToday?: number;
}

export interface RecentActivity {
  recentLesson: {
    lesson: {
      id: string;
      title: string;
      imageUrl: string | null;
      module: {
        id: string;
        title: string;
      };
    };
    lastAccessedAt: string;
    completedTeachings: number;
    totalTeachings: number;
    dueReviewCount: number;
  } | null;
  recentTeaching: {
    teaching: {
      id: string;
      userLanguageString: string;
      learningLanguageString: string;
    };
    lesson: {
      id: string;
      title: string;
      module: {
        id: string;
        title: string;
      };
    };
    completedAt: string;
  } | null;
  recentQuestion: {
    question: {
      id: string;
    };
    teaching: {
      id: string;
      userLanguageString: string;
      learningLanguageString: string;
    };
    lesson: {
      id: string;
      title: string;
      module: {
        id: string;
        title: string;
      };
    };
    lastRevisedAt: string;
    nextReviewDue?: string;
  } | null;
}

export async function getMyProfile(): Promise<Profile | null> {
  return apiClient.get<Profile>('/me/profile');
}

export async function upsertMyProfile(data: {
  name?: string;
  avatarUrl?: string;
}): Promise<Profile> {
  if (data.name || data.avatarUrl) {
    return apiClient.patch<Profile>('/me', data);
  }
  return apiClient.post<Profile>('/me/profile/ensure', data);
}

export async function ensureProfileSeed(name?: string): Promise<Profile> {
  const cleanProvided = name?.trim();

  let derivedName: string | undefined;
  if (!cleanProvided) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const meta = (data.user.user_metadata ?? {}) as any;
        const metaName =
          (typeof meta?.name === 'string' && meta.name) ||
          (typeof meta?.full_name === 'string' && meta.full_name) ||
          (typeof meta?.display_name === 'string' && meta.display_name) ||
          undefined;

        const cleanedMeta = metaName?.trim();
        if (cleanedMeta) {
          derivedName = cleanedMeta;
        } else if (data.user.email) {
          const emailName = data.user.email.split('@')[0]?.trim();
          if (emailName) {
            derivedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
        }
      }
    } catch {}
  }

  const finalName = cleanProvided || derivedName;
  return apiClient.post<Profile>('/me/profile/ensure', finalName ? { name: finalName } : undefined);
}

export async function getDashboard(options?: { tzOffsetMinutes?: number }): Promise<DashboardData> {
  const query = buildTzQueryString(options);
  const url = appendQueryString('/me/dashboard', query);
  return apiClient.get<DashboardData>(url);
}

export async function getStats(options?: { tzOffsetMinutes?: number }): Promise<StatsData> {
  const query = buildTzQueryString(options);
  const url = appendQueryString('/me/stats', query);
  return apiClient.get<StatsData>(url);
}

export async function getRecentActivity(): Promise<RecentActivity> {
  return apiClient.get<RecentActivity>('/me/recent');
}

/**
 * Upload an avatar image.
 *
 * Orchestrates file reading, storage upload, and backend sync.
 * Delegates to focused services following Single Responsibility Principle.
 */
export async function uploadAvatar(imageUri: string, userId: string): Promise<string> {
  try {
    // Cache locally for quick access
    await cacheAvatarFile(imageUri, userId);

    // Read file bytes (handles platform differences)
    const { bytes, extension } = await readAvatarAsBytes(imageUri);

    // Upload to Supabase Storage
    const publicUrl = await uploadAvatarToStorage(bytes, userId, extension);

    // Sync URL with backend (non-blocking)
    try {
      await apiClient.post<{ avatarUrl: string }>('/me/avatar', {
        avatarUrl: publicUrl,
      });
    } catch (apiError) {
      Logger.error('Failed to save avatar URL to backend', apiError);
    }

    return publicUrl;
  } catch (error) {
    await clearCachedAvatar(userId).catch(() => {});
    throw error;
  }
}

/**
 * Refresh a signed avatar URL if it's a Supabase Storage URL.
 *
 * Uses focused storage utilities following Single Responsibility Principle.
 */
export async function refreshSignedAvatarUrlFromUrl(url: string): Promise<string> {
  if (!url) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const isSupabaseStorage =
      urlObj.hostname.includes('supabase.co') &&
      urlObj.pathname.includes('/storage/v1/object/');

    if (!isSupabaseStorage) {
      return url;
    }

    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/,
    );
    if (!pathMatch) {
      return url;
    }

    const [, bucket, filePath] = pathMatch;

    // Only refresh signed URLs (those with a token)
    if (urlObj.searchParams.has('token')) {
      const signedUrl = await getSignedAvatarUrl(bucket, filePath);
      if (signedUrl) {
        return signedUrl;
      }

      // Fall back to public URL if signed URL fails
      const publicUrl = getPublicAvatarUrl(bucket, filePath);
      return publicUrl || url;
    }

    return url;
  } catch (error) {
    Logger.error('Error refreshing signed URL', error);
    return url;
  }
}
