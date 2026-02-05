import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadingScreen } from '@/components/ui';
import { resolvePostAuthDestination } from '@/features/auth/flows/resolvePostAuthDestination';
import { useAuth } from '@/services/auth/AuthProvider';
import { createLogger } from '@/services/logging';
import { isPublicRootSegment } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';

const Logger = createLogger('RouteGuard');

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, error } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();
  const redirectingRef = useRef(false);

  const pathname = useMemo(() => {
    if (segments.length === 0) return '/';
    return `/${segments.join('/')}`;
  }, [segments]);
  const isPublic = useMemo(() => {
    // Index route (/) is considered public for RouteGuard purposes
    if (segments.length === 0) return true;
    return isPublicRootSegment(segments[0]);
  }, [segments]);

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

      // Don't redirect from onboarding or auth routes - let those flows handle their own navigation
      const isOnboardingRoute = pathname.startsWith('/(onboarding)');
      const isAuthRoute = pathname.startsWith('/(auth)');
      const isIndexRoute = pathname === '/' || pathname === '';

      if (isOnboardingRoute || isAuthRoute) {
        redirectingRef.current = false;
        return;
      }

      // For index route (app/index), resolve destination: home if onboarding done, else onboarding
      if (isIndexRoute) {
        redirectingRef.current = true;
        // Use InteractionManager to wait for navigation to be ready without blocking Detox sync
        const { InteractionManager } = require('react-native');
        InteractionManager.runAfterInteractions(async () => {
          try {
            const dest = await resolvePostAuthDestination(session.user.id);
            if (dest) router.replace(dest);
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            Logger.error('Error redirecting from index', error);
          } finally {
            redirectingRef.current = false;
          }
        });
        return;
      }

      // For other public routes, use resolvePostAuthDestination
      redirectingRef.current = true;
      // Use InteractionManager to wait for navigation to be ready without blocking Detox sync
      const { InteractionManager } = require('react-native');
      InteractionManager.runAfterInteractions(async () => {
        try {
          const dest = await resolvePostAuthDestination(session.user.id);
          // Only redirect if destination is different from current path
          // Never redirect away from onboarding routes
          if (dest && dest !== pathname && !dest.startsWith('/(onboarding)')) {
            router.replace(dest);
          }
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          Logger.error('Error resolving post-auth destination', error);
        } finally {
          redirectingRef.current = false;
        }
      });
    };
    redirectIfNeeded();
  }, [loading, error, session?.user?.id, isPublic, pathname, router]);

  if (loading) {
    return (
      <LoadingScreen
        title="Checking session..."
        subtitle="Please wait while we confirm your account."
        safeArea
      />
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
