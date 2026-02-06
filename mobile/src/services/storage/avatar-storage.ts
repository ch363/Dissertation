import { getSupabaseClient } from '@/services/supabase/client';
import { createLogger } from '@/services/logging';

const Logger = createLogger('AvatarStorage');

/**
 * AvatarStorageService
 *
 * Handles uploading avatars to Supabase Storage.
 * Follows Single Responsibility Principle - focused only on storage operations.
 */

/**
 * Upload avatar bytes to Supabase Storage.
 *
 * @param bytes - The avatar file bytes
 * @param userId - The user's ID
 * @param extension - The file extension (jpg, png, etc.)
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatarToStorage(
  bytes: Uint8Array,
  userId: string,
  extension: string,
): Promise<string> {
  const fileName = `${userId}/avatar.${extension}`;
  const supabase = getSupabaseClient();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, bytes, {
      contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      upsert: true,
    });

  if (uploadError) {
    Logger.error('Supabase Storage upload error', uploadError);
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL from Supabase Storage');
  }

  return urlData.publicUrl;
}

/**
 * Get a signed URL for an avatar.
 *
 * @param bucket - The storage bucket
 * @param filePath - The file path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns The signed URL
 */
export async function getSignedAvatarUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    Logger.error('Failed to create signed URL', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get public URL for an avatar.
 *
 * @param bucket - The storage bucket
 * @param filePath - The file path within the bucket
 * @returns The public URL or null
 */
export function getPublicAvatarUrl(
  bucket: string,
  filePath: string,
): string | null {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || null;
}
