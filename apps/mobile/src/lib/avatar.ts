import { getSupabaseClient } from './supabase';

function fileNameFromUri(uri: string) {
  const q = uri.split('?')[0];
  return q.split('/').pop() || `image-${Date.now()}.jpg`;
}

export async function uploadAvatar(fileUri: string, userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const fileName = fileNameFromUri(fileUri);
  const path = `${userId}/${Date.now()}-${fileName}`;
  const res = await fetch(fileUri);
  const blob = await res.blob();
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
  if (upErr) throw upErr;
  // Prefer signed URL if bucket is private; fallback to public URL
  const signed = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!signed.error && signed.data?.signedUrl) return signed.data.signedUrl;
  const pub = supabase.storage.from('avatars').getPublicUrl(path);
  return pub.data.publicUrl;
}

// Try to refresh a Supabase signed URL if the url points to a signed avatars object.
// If parsing fails or storage re-sign fails, returns the original url.
export async function refreshSignedAvatarUrlFromUrl(url: string): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const u = new URL(url);
    // Match /storage/v1/object/sign/avatars/<path>
    const parts = u.pathname.split('/');
    const signIdx = parts.findIndex((p) => p === 'sign');
    const bucketIdx = parts.findIndex((p) => p === 'avatars');
    if (signIdx === -1 || bucketIdx === -1 || bucketIdx <= signIdx) return url;
    const pathSegments = parts.slice(bucketIdx + 1);
    if (pathSegments.length === 0) return url;
    const objectPath = decodeURIComponent(pathSegments.join('/'));
    const signed = await supabase.storage
      .from('avatars')
      .createSignedUrl(objectPath, 60 * 60 * 24 * 7);
    if (signed.error || !signed.data?.signedUrl) return url;
    return signed.data.signedUrl;
  } catch {
    return url;
  }
}
