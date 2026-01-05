import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabaseClient } from '../lib/supabase';
import { getMyProfile, type Profile } from '../modules/profile';

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh: async () => {},
});

async function loadProfile(): Promise<Profile | null> {
  try {
    return await getMyProfile();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('AuthProvider profile load failed', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const nextSession = data.session ?? null;
      setSession(nextSession);
      if (nextSession?.user) {
        const prof = await loadProfile();
        setProfile(prof);
      } else {
        setProfile(null);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load session');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        loadProfile().then((prof) => {
          if (mounted) setProfile(prof);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      error,
      refresh,
    }),
    [session, profile, loading, error, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
