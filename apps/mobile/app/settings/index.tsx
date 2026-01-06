import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/modules/auth';
import {
  useAppTheme,
  getAdaptivityEnabled,
  setAdaptivityEnabled,
  getNotificationsEnabled,
  setNotificationsEnabled,
} from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useAppTheme();
  const [adaptivity, setAdaptivity] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<boolean>(true);
  const navigation = useNavigation();
  // If this screen is rendered inside tab bar, no custom back button
  const showBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();

  const handleBack = useCallback(() => {
    try {
      // Prefer going back if we have a stack history
      // @ts-ignore - navigation type from expo-router bridges React Navigation
      if (navigation?.canGoBack?.() === true) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    try {
      router.replace('/nav-bar/home');
    } catch {
      router.push('/nav-bar/home');
    }
  }, [navigation]);

  useEffect(() => {
    (async () => {
      setAdaptivity(await getAdaptivityEnabled());
      setNotifications(await getNotificationsEnabled());
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top-right back arrow to return to Home */}
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            hitSlop={12}
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
          </Pressable>
        )}

        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View
          style={[
            styles.row,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Speech Settings"
          onPress={() => router.push('/settings/speech')}
          style={[
            styles.row,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Speech</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
        </Pressable>
        <View
          style={[
            styles.row,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Adaptivity</Text>
          <Switch
            value={adaptivity}
            onValueChange={async (v) => {
              setAdaptivity(v);
              await setAdaptivityEnabled(v);
            }}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>

        <View
          style={[
            styles.row,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={async (v) => {
              setNotifications(v);
              await setNotificationsEnabled(v);
            }}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>

        {/* Developer tools */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open DB Health"
          onPress={() => router.push('/db-health')}
          style={[
            styles.row,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>DB Health</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={async () => {
            await signOut();
            router.replace('/auth/sign-in');
          }}
          style={[
            styles.row,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Sign out</Text>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.mutedText} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
    padding: baseTheme.spacing.lg,
  },
  backBtn: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: baseTheme.colors.card,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    marginBottom: baseTheme.spacing.md,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  label: { fontFamily: baseTheme.typography.regular, color: baseTheme.colors.text },
});

