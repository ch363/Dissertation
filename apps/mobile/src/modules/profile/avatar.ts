import { refreshSignedAvatarUrlFromUrl, uploadAvatar } from '../../lib/avatar';

/**
 * Avatar facade keeps UI imports stable while allowing lib implementations to change.
 */
export async function uploadProfileAvatar(fileUri: string, userId: string) {
  return uploadAvatar(fileUri, userId);
}

export async function refreshAvatarUrl(url: string) {
  return refreshSignedAvatarUrlFromUrl(url);
}
