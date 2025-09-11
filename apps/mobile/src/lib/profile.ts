import { supabase } from './supabase';

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMyProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertMyProfile(update: Partial<Profile>) {
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) throw new Error('No user');
  const payload = { id, ...update };
  const { data, error } = await supabase.from('profiles').upsert(payload).select().single();
  if (error) throw error;
  return data as Profile;
}

// Ensure a profile row exists for the current authenticated user
export async function ensureProfileSeed(name?: string) {
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return null; // not signed in yet (e.g., email confirm flow)
  // Prefer provided name, then auth metadata name, otherwise null
  const preferredName = (name && String(name).trim()) ||
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
