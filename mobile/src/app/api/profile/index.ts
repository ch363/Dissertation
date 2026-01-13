import { apiClient } from '@/services/api/client';
import { parseProfile, type ProfileDto } from '@/types/profile';
import { getSupabaseClient } from '@/app/api/supabase/client';

export type Profile = ProfileDto;

// Transform backend User model to ProfileDto format
function transformUserToProfile(user: any): ProfileDto {
  if (!user || !user.id) {
    throw new Error('Invalid user data: missing id');
  }
  
  return {
    id: String(user.id),
    name: user.name ?? null,
    avatar_url: user.avatarUrl ?? user.avatar_url ?? null,
    created_at: user.createdAt 
      ? (typeof user.createdAt === 'string' ? user.createdAt : new Date(user.createdAt).toISOString())
      : new Date().toISOString(),
    updated_at: user.updatedAt 
      ? (typeof user.updatedAt === 'string' ? user.updatedAt : new Date(user.updatedAt).toISOString())
      : new Date().toISOString(),
  };
}

export async function getMyProfile() {
  try {
    const response = await apiClient.get<any>('/me');
    
    // Handle both wrapped and unwrapped responses
    const user = response?.data || response;
    
    if (!user || !user.id) {
      console.warn('getMyProfile: No user data returned from /me', { response, user });
      return null;
    }
    
    const profile = transformUserToProfile(user);
    return parseProfile(profile);
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return null;
    }
    // Don't throw for transformation errors - return null to allow app to continue
    if (error?.message?.includes('Invalid user data') || error?.message?.includes('Required')) {
      console.warn('getMyProfile: Profile transformation failed', error);
      return null;
    }
    // Handle unique constraint errors gracefully - user might already exist
    if (error?.message?.includes('Unique constraint') || error?.statusCode === 409) {
      console.warn('getMyProfile: User already exists, retrying fetch', error);
      // Retry once to get the existing user
      try {
        const retryResponse = await apiClient.get<any>('/me');
        const retryUser = retryResponse?.data || retryResponse;
        if (retryUser && retryUser.id) {
          return parseProfile(transformUserToProfile(retryUser));
        }
      } catch (retryError) {
        console.error('getMyProfile: Retry failed', retryError);
      }
      return null;
    }
    console.error('getMyProfile error', error);
    throw error;
  }
}

export async function upsertMyProfile(update: Partial<Profile>) {
  // Map Profile fields to User model fields
  const updatePayload: any = {};
  if (update.name !== undefined) updatePayload.name = update.name;
  if (update.avatar_url !== undefined) updatePayload.avatarUrl = update.avatar_url;

  try {
    const user = await apiClient.patch<any>('/me', updatePayload);
    return transformUserToProfile(user);
  } catch (error) {
    console.error('upsertMyProfile failed', { update, error });
    throw error;
  }
}

// Ensure a profile row exists for the current authenticated user
export async function ensureProfileSeed(name?: string) {
  try {
    const supabase = getSupabaseClient();
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return null; // not signed in yet (e.g., email confirm flow)

    // Prefer provided name, then auth metadata name, otherwise null
    const preferredName =
      (name && String(name).trim()) ||
      (u.user?.user_metadata?.name && String(u.user.user_metadata.name).trim()) ||
      null;

    try {
      // Get current profile - this will provision the user if it doesn't exist
      const currentUser = await apiClient.get<any>('/me');
      
      if (currentUser && currentUser.id) {
        // Update name if it's missing and we have a better one
        const currentName = currentUser.name as string | null | undefined;
        if ((!currentName || String(currentName).trim() === '') && preferredName) {
          const updated = await upsertMyProfile({ name: preferredName });
          return updated;
        }
        return transformUserToProfile(currentUser);
      }

      // If /me didn't return a user, try the ensure endpoint
      if (preferredName) {
        const created = await apiClient.post<any>('/me/profile/ensure', { name: preferredName });
        if (created && created.id) {
          return transformUserToProfile(created);
        }
      }
      
      // Fallback: just return the user from /me
      if (currentUser && currentUser.id) {
        return transformUserToProfile(currentUser);
      }
      
      return null;
    } catch (error: any) {
      // If it's a unique constraint error, the user already exists - try to fetch it
      if (error?.message?.includes('Unique constraint') || error?.statusCode === 409) {
        try {
          const existingUser = await apiClient.get<any>('/me');
          if (existingUser && existingUser.id) {
            return transformUserToProfile(existingUser);
          }
        } catch (fetchError) {
          console.error('Failed to fetch existing user after constraint error:', fetchError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('ensureProfileSeed failed', { name, error });
    throw error;
  }
}
