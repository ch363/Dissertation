import { getSupabaseClient } from './supabase';

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMyProfile() {
  const supabase = getSupabaseClient();
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('getMyProfile error', error);
    throw error;
  }
  return (data as Profile) ?? null;
}

export async function upsertMyProfile(update: Partial<Profile>) {
  const supabase = getSupabaseClient();
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) throw new Error('No user');
  // Remove undefined to avoid overwriting fields unintentionally
  const payload: any = { id };
  for (const [k, v] of Object.entries(update)) {
    if (v !== undefined) payload[k] = v;
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  } catch {
    // Fallback: attempt update if row exists
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    } catch (inner) {
      // Surface original error context
      // eslint-disable-next-line no-console
      console.error('upsertMyProfile failed', { payload, error: inner });
      throw inner;
    }
  }
}

// Ensure a profile row exists for the current authenticated user
export async function ensureProfileSeed(name?: string) {
  const supabase = getSupabaseClient();
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return null; // not signed in yet (e.g., email confirm flow)
  // Prefer provided name, then auth metadata name, otherwise null
  const preferredName =
    (name && String(name).trim()) ||
    (u.user?.user_metadata?.name && String(u.user.user_metadata.name).trim()) ||
    null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    // Update name if it's missing and we have a better one
    const currentName = (data as any).name as string | null | undefined;
    if ((!currentName || String(currentName).trim() === '') && preferredName) {
      const updated = await upsertMyProfile({ name: preferredName });
      return updated;
    }
    return data; // already exists with a name (or we can't improve)
  }
  const created = await upsertMyProfile({ name: preferredName });
  return created;
}
