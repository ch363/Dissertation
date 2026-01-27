import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListDivider, ListRow, ScrollView, SurfaceCard } from '@/components/ui';
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

type SectionProps = {
  title: string;
  color: string;
  children: ReactNode;
};

function Section({ title, color, children }: SectionProps) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionHeader, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useAppTheme();
  const [adaptivity, setAdaptivity] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setAdaptivity(await getAdaptivityEnabled());
      setNotifications(await getNotificationsEnabled());
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <Text style={[styles.intro, { color: theme.colors.mutedText }]}>
          Tailor Fluentia to how you learn best
        </Text>

        <Section title="APPEARANCE" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <ListRow
              title="Dark Mode"
              right={
                <Switch
                  accessibilityRole="switch"
                  accessibilityLabel="Dark Mode"
                  accessibilityState={{ checked: isDark }}
                  value={isDark}
                  onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                  trackColor={{ true: theme.colors.primary }}
                />
              }
              // The switch is the primary control; keep row non-pressable to avoid double activation.
              onPress={undefined}
              style={styles.row}
            />
          </SurfaceCard>
        </Section>

        <Section title="LEARNING" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <ListRow
              title="Speech"
              accessibilityLabel="Open Speech Settings"
              accessibilityHint="Configure text to speech and speed"
              onPress={() => router.push(routes.tabs.settings.speech)}
              right={<Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />}
              style={styles.row}
            />

            <ListDivider insetLeft={baseTheme.spacing.md} />

            <ListRow
              title="Session defaults"
              subtitle="Preferred session length and exercise types"
              accessibilityLabel="Open Session defaults"
              onPress={() => router.push(routes.tabs.settings.session)}
              right={<Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />}
              style={styles.row}
            />

            <ListDivider insetLeft={baseTheme.spacing.md} />

            <ListRow
              title="Adaptivity"
              subtitle="Adjusts difficulty and review timing based on your performance"
              right={
                <Switch
                  accessibilityRole="switch"
                  accessibilityLabel="Adaptivity"
                  accessibilityState={{ checked: adaptivity }}
                  value={adaptivity}
                  onValueChange={async (v) => {
                    setAdaptivity(v);
                    await setAdaptivityEnabled(v);
                  }}
                  trackColor={{ true: theme.colors.primary }}
                />
              }
              onPress={undefined}
              style={styles.row}
            />
          </SurfaceCard>
        </Section>

        <Section title="NOTIFICATIONS" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <ListRow
              title="Notifications"
              right={
                <Switch
                  accessibilityRole="switch"
                  accessibilityLabel="Notifications"
                  accessibilityState={{ checked: notifications }}
                  value={notifications}
                  onValueChange={async (v) => {
                    setNotifications(v);
                    await setNotificationsEnabled(v);
                  }}
                  trackColor={{ true: theme.colors.primary }}
                />
              }
              onPress={undefined}
              style={styles.row}
            />
          </SurfaceCard>
        </Section>

        <Section title="ACCOUNT" color={theme.colors.mutedText}>
          <SurfaceCard
            style={[
              styles.card,
              styles.accountCard,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}
          >
            <ListRow
              title="Sign out"
              variant="destructive"
              accessibilityLabel="Sign out"
              accessibilityHint="Signs you out of your account"
              onPress={() => {
                Alert.alert('Sign out?', 'You will need to sign in again to continue.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign out',
                    style: 'destructive',
                    onPress: async () => {
                      await signOut();
                      router.replace(routes.auth.signIn);
                    },
                  },
                ]);
              }}
              right={<Ionicons name="exit-outline" size={18} color={theme.colors.error} />}
              style={styles.row}
            />
          </SurfaceCard>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 22,
  },
  intro: {
    marginTop: 2,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionWrap: {
    gap: baseTheme.spacing.sm,
  },
  sectionHeader: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  card: {
    padding: 0,
  },
  accountCard: {
    borderRadius: baseTheme.radius.lg,
  },
  // Shared list primitives handle layout; keep this for any card-specific tweaks.
  row: {},
});
