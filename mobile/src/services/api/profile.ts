import { Platform } from 'react-native';

import { apiClient } from './client';
import { getSupabaseClient } from '@/services/supabase/client';
import {
  cacheAvatarFile,
  clearCachedAvatar,
} from '@/services/cache/avatar-cache';

// Lazy load FileSystem to avoid native module errors during hot reload
let FileSystemModule: typeof import('expo-file-system') | null = null;

async function getFileSystemModule() {
  if (!FileSystemModule) {
    FileSystemModule = await import('expo-file-system');
  }
  return FileSystemModule;
}

export interface Profile {
  id: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  displayName?: string; // Will be added by backend in Phase 2
}

export interface DashboardData {
  dueReviewCount: number;
  activeLessonCount: number;
  xpTotal: number;
  streak: number | null;
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
    completedTeachings: number;
    totalTeachings: number;
    dueReviewCount: number;
  };
  recentTeaching: {
    teaching: {
      id: string;
      userLanguageString: string;
      learningLanguageString: string;
      lesson: {
        id: string;
        title: string;
        module: {
          id: string;
          title: string;
        };
      };
    };
    completedAt: string;
  } | null;
  recentQuestion: {
    question: {
      id: string;
      prompt: string;
      teaching: {
        id: string;
        userLanguageString: string;
        learningLanguageString: string;
        lesson: {
          id: string;
          title: string;
          module: {
            id: string;
            title: string;
          };
        };
      };
    };
    lastRevisedAt: string;
  } | null;
}

/**
 * Get current user profile
 */
export async function getMyProfile(): Promise<Profile | null> {
  return apiClient.get<Profile>('/me/profile');
}

/**
 * Update or create user profile
 */
export async function upsertMyProfile(data: { name?: string; avatarUrl?: string }): Promise<Profile> {
  if (data.name || data.avatarUrl) {
    // Update existing profile
    return apiClient.patch<Profile>('/me', data);
  }
  // Ensure profile exists
  return apiClient.post<Profile>('/me/profile/ensure', data);
}

/**
 * Ensure profile exists (provisioning)
 */
export async function ensureProfileSeed(name?: string): Promise<Profile> {
  return apiClient.post<Profile>('/me/profile/ensure', name ? { name } : undefined);
}

/**
 * Get user dashboard statistics
 */
export async function getDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>('/me/dashboard');
}

/**
 * Get recent activity
 */
export async function getRecentActivity(): Promise<RecentActivity> {
  return apiClient.get<RecentActivity>('/me/recent');
}

/**
 * Upload avatar image to Supabase Storage
 * Caches the image locally first for instant preview, then uploads to Supabase Storage
 * @param imageUri - Local file URI from expo-image-picker
 * @param userId - User ID for file naming and caching
 * @returns Public URL from Supabase Storage
 */
export async function uploadAvatar(imageUri: string, userId: string): Promise<string> {
  try {
    // Step 1: Cache the local file immediately for instant preview
    await cacheAvatarFile(imageUri, userId);

    // Step 2: Read the file for upload
    const FileSystem = await getFileSystemModule();
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }

    // Get file extension from URI or default to jpg
    const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar.${extension}`;

    // Step 3: Upload to Supabase Storage
    // Read file as base64 and convert to binary for upload
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array (React Native compatible)
    // Use atob if available (web), otherwise manual decode for React Native
    let binaryString: string;
    if (Platform.OS === 'web' && typeof atob !== 'undefined') {
      binaryString = atob(base64Data);
    } else {
      // Manual base64 decode for React Native
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
      binaryString = output;
    }
    
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const supabase = getSupabaseClient();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, bytes, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: true, // Replace existing file if it exists
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    // Step 4: Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL from Supabase Storage');
    }

    const publicUrl = urlData.publicUrl;

    // Step 5: Save URL to database via backend API
    try {
      await apiClient.post<{ avatarUrl: string }>('/me/avatar', {
        avatarUrl: publicUrl,
      });
    } catch (apiError) {
      console.error('Failed to save avatar URL to backend:', apiError);
      // Don't throw - the upload was successful, URL can be saved later
    }

    return publicUrl;
  } catch (error) {
    // Clear cached file on error
    await clearCachedAvatar(userId).catch(() => {
      // Ignore cache clear errors
    });
    throw error;
  }
}

/**
 * Refresh signed avatar URL from stored URL
 * If the URL is from Supabase Storage and the bucket is private, generates a signed URL
 * For public buckets, returns the URL as-is
 * @param url - Avatar URL (Supabase Storage URL or other)
 * @returns Refreshed URL (signed if private bucket, original if public)
 */
export async function refreshSignedAvatarUrlFromUrl(url: string): Promise<string> {
  if (!url) {
    return url;
  }

  try {
    // Check if URL is from Supabase Storage
    const supabase = getSupabaseClient();
    const supabaseUrl = supabase.storage.url;
    
    // Extract bucket and file path from URL
    // Supabase Storage URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    // or: https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
    const urlObj = new URL(url);
    const isSupabaseStorage = urlObj.hostname.includes('supabase.co') && 
                              urlObj.pathname.includes('/storage/v1/object/');

    if (!isSupabaseStorage) {
      // Not a Supabase Storage URL, return as-is
      return url;
    }

    // Extract bucket and file path
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
    if (!pathMatch) {
      // Can't parse URL, return as-is
      return url;
    }

    const [, bucket, filePath] = pathMatch;

    // Check if URL is already signed (has token parameter)
    if (urlObj.searchParams.has('token')) {
      // URL is already signed, but might be expired
      // Generate a new signed URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Failed to create signed URL:', error);
        // If signed URL generation fails, try public URL as fallback
        const { data: publicData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        return publicData?.publicUrl || url;
      }

      return data.signedUrl;
    }

    // URL is public, return as-is
    return url;
  } catch (error) {
    console.error('Error refreshing signed URL:', error);
    // On error, return original URL
    return url;
  }
}
