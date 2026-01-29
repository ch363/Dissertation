import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui';
import {
  getSupabaseConfigStatus,
  initSupabaseClient,
  SupabaseConfigError,
} from '@/services/supabase/client';
import { useAppTheme } from '@/services/theme/ThemeProvider';

type ConfigStatus = ReturnType<typeof getSupabaseConfigStatus>;

export function useSupabaseConfig() {
  const [status, setStatus] = useState<ConfigStatus>(() => getSupabaseConfigStatus());

  const retry = useCallback(() => {
    try {
      initSupabaseClient();
      setStatus(getSupabaseConfigStatus());
    } catch (err: unknown) {
      const missing = err instanceof SupabaseConfigError ? err.missing : [];
      setStatus({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to initialize Supabase. Check environment configuration.',
        missing,
      });
    }
  }, []);

  useEffect(() => {
    retry();
  }, [retry]);

  return { status, retry };
}

export function SupabaseConfigGate({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const { status, retry } = useSupabaseConfig();

  const body = useMemo(() => {
    if (status.status === 'pending') {
      return (
        <LoadingScreen
          title="Checking configuration..."
          subtitle="Please wait while we verify your connection."
        />
      );
    }

    if (status.status === 'error') {
      return (
        <View style={styles.center}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Configuration needed</Text>
          <Text style={[styles.message, { color: theme.colors.mutedText }]}>{status.message}</Text>
          {status.missing?.length ? (
            <Text style={[styles.code, { color: theme.colors.text }]}>
              Missing: {status.missing.join(', ')}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry configuration check"
            accessibilityHint="Attempts to reinitialize Supabase with the current environment configuration"
            onPress={retry}
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary, marginTop: theme.spacing.md },
            ]}
          >
            <Text style={{ color: theme.colors.onPrimary, fontFamily: theme.typography.semiBold }}>
              Retry
            </Text>
          </Pressable>
        </View>
      );
    }

    return children;
  }, [children, status, theme, retry]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 4,
  },
  code: {
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
