import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from './AuthProvider';
import { useAppTheme } from './ThemeProvider';

import { resolvePostAuthDestination } from '@/modules/auth';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, error } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();

  const pathname = useMemo(() => `/${segments.join('/')}`, [segments]);
  const isPublic = useMemo(() => {
    const root = segments[0];
    return root === undefined || root === 'auth';
  }, [segments]);

  useEffect(() => {
    const redirectIfNeeded = async () => {
      if (loading || error || !session?.user?.id) return;
      if (!isPublic) return;
      const dest = await resolvePostAuthDestination(session.user.id);
      if (dest && dest !== pathname) {
        router.replace(dest);
      }
    };
    redirectIfNeeded();
  }, [loading, error, session?.user?.id, isPublic, pathname, router]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background, paddingHorizontal: 24 }]}
      >
        <Text style={[styles.message, { color: theme.colors.error }]}>Auth error: {error}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
