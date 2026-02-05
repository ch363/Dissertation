import { apiClient } from './client';
import { buildTzQueryString, appendQueryString } from './query-builder';

import { cacheAvatarFile, clearCachedAvatar } from '@/services/cache/avatar-cache';
import { createLogger } from '@/services/logging';
import { getSupabaseClient } from '@/services/supabase/client';
import { getFileSystemModule } from '@/services/utils/file-system-loader';

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

export async function uploadAvatar(imageUri: string, userId: string): Promise<string> {
  try {
    await cacheAvatarFile(imageUri, userId);

    const FileSystem = await getFileSystemModule();

    const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar.${extension}`;

    let bytes: Uint8Array;
    if (FileSystem) {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file not found');
      }

      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      let i = 0;
      const cleanBase64 = base64Data.replace(/[^A-Za-z0-9\+\/\=]/g, '');
      while (i < cleanBase64.length) {
        const enc1 = chars.indexOf(cleanBase64.charAt(i++));
        const enc2 = chars.indexOf(cleanBase64.charAt(i++));
        const enc3 = chars.indexOf(cleanBase64.charAt(i++));
        const enc4 = chars.indexOf(cleanBase64.charAt(i++));
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        output += String.fromCharCode(chr1);
        if (enc3 !== 64) output += String.fromCharCode(chr2);
        if (enc4 !== 64) output += String.fromCharCode(chr3);
      }

      bytes = new Uint8Array(output.length);
      for (let j = 0; j < output.length; j++) {
        bytes[j] = output.charCodeAt(j);
      }
    } else if (Platform.OS === 'web') {
      const resp = await fetch(imageUri);
      if (!resp.ok) {
        throw new Error(`Failed to read image for upload (HTTP ${resp.status})`);
      }
      const ab = await resp.arrayBuffer();
      bytes = new Uint8Array(ab);
    } else {
      throw new Error(
        'File system is not available. Please rebuild the app (expo run:ios / expo run:android).',
      );
    }

    const supabase = getSupabaseClient();

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, bytes, {
      contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      upsert: true,
    });

    if (uploadError) {
      Logger.error('Supabase Storage upload error', uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL from Supabase Storage');
    }

    const publicUrl = urlData.publicUrl;

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

export async function refreshSignedAvatarUrlFromUrl(url: string): Promise<string> {
  if (!url) {
    return url;
  }

  try {
    const supabase = getSupabaseClient();
    const urlObj = new URL(url);
    const isSupabaseStorage =
      urlObj.hostname.includes('supabase.co') && urlObj.pathname.includes('/storage/v1/object/');

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

    if (urlObj.searchParams.has('token')) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);

      if (error) {
        Logger.error('Failed to create signed URL', error);
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return publicData?.publicUrl || url;
      }

      return data.signedUrl;
    }

    return url;
  } catch (error) {
    Logger.error('Error refreshing signed URL', error);
    return url;
  }
}
