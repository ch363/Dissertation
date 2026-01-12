import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { resolvePostAuthDestination } from '@/features/auth/flows/resolvePostAuthDestination';
import { useAuth } from '@/services/auth/AuthProvider';
import { isPublicRootSegment } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, error } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();
  const redirectingRef = useRef(false);

  const pathname = useMemo(() => `/${segments.join('/')}`, [segments]);
  const isPublic = useMemo(() => isPublicRootSegment(segments[0]), [segments]);

  useEffect(() => {
    const redirectIfNeeded = async () => {
      if (loading || error || !session?.user?.id) {
        redirectingRef.current = false;
        return;
      }
      if (!isPublic) {
        redirectingRef.current = false;
        return;
      }
      // Prevent multiple simultaneous redirects
      if (redirectingRef.current) return;

      try {
        redirectingRef.current = true;
        const dest = await resolvePostAuthDestination(session.user.id);
        // Only redirect if destination is different from current path
        if (dest && dest !== pathname) {
          router.replace(dest);
        }
      } catch (err) {
        // Log error but don't break navigation
        // If there's an error checking onboarding, default to showing onboarding
        console.error('RouteGuard: Error resolving post-auth destination', err);
        // Don't redirect on error - let user stay on current page
      } finally {
        // Reset redirect flag after a short delay to allow navigation to complete
        setTimeout(() => {
          redirectingRef.current = false;
        }, 100);
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
