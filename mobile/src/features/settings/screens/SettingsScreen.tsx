import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/services/api/auth';
import { routes } from '@/services/navigation/routes';
import {
  useAppTheme,
  getAdaptivityEnabled,
  setAdaptivityEnabled,
  getNotificationsEnabled,
  setNotificationsEnabled,
} from '@/services/preferences/settings-facade';
import { theme as baseTheme } from '@/services/theme/tokens';

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
      router.replace(routes.tabs.home);
    } catch {
      router.push(routes.tabs.home);
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
          onPress={() => router.push(routes.tabs.settings.speech)}
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={async () => {
            await signOut();
            router.replace('/sign-in');
          }}
          style={[
            styles.row,
            styles.logout,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.error }]}>Sign out</Text>
          <Ionicons name="exit-outline" size={18} color={theme.colors.error} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  logout: {
    marginTop: baseTheme.spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: baseTheme.spacing.md,
  },
});
