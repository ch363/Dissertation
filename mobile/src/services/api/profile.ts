import { apiClient } from './client';

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
 * Upload avatar image
 * TODO: In the future, accept file upload and store in Supabase Storage
 * For now, accepts avatarUrl and updates user record
 */
export async function uploadAvatar(imageUri: string, userId: string): Promise<string> {
  // For now, send the URI to backend which will update the user record
  // In the future, this should upload the file to Supabase Storage
  const response = await apiClient.post<{ avatarUrl: string }>('/me/avatar', {
    avatarUrl: imageUri,
  });
  return response.avatarUrl;
}

/**
 * Refresh signed avatar URL from stored URL
 * TODO: Implement backend endpoint or handle in frontend
 */
export async function refreshSignedAvatarUrlFromUrl(url: string): Promise<string> {
  // For now, return URL as-is
  // Backend could provide an endpoint to refresh signed URLs from Supabase Storage
  // Or this could be handled client-side if using Supabase Storage directly
  return url;
}
