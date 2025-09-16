import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

import { PENDING_PROFILE_NAME_KEY } from '../lib/auth';
import { ensureProfileSeed } from '../lib/profile';
import { supabase } from '../lib/supabase';

type AuthContextType = { user: any | null; loading: boolean };
const AuthCtx = createContext<AuthContextType>({ user: null, loading: true });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          const pending = await AsyncStorage.getItem(PENDING_PROFILE_NAME_KEY);
          await ensureProfileSeed(pending || undefined);
          if (pending) await AsyncStorage.removeItem(PENDING_PROFILE_NAME_KEY);
        } catch {}
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        try {
          const pending = await AsyncStorage.getItem(PENDING_PROFILE_NAME_KEY);
          await ensureProfileSeed(pending || undefined);
          if (pending) await AsyncStorage.removeItem(PENDING_PROFILE_NAME_KEY);
        } catch {}
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthCtx.Provider value={{ user, loading }}>{children}</AuthCtx.Provider>;
}
