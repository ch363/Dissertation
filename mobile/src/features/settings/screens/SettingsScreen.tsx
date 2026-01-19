import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView, SurfaceCard } from '@/components/ui';
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

function RowDivider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
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
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>
          </SurfaceCard>
        </Section>

        <Section title="LEARNING" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Speech Settings"
              onPress={() => router.push(routes.tabs.settings.speech)}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Speech</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
            </Pressable>

            <RowDivider color={theme.colors.border} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Session Defaults"
              onPress={() => router.push(routes.tabs.settings.session)}
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Session defaults</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.mutedText }]}>
                  Preferred session length and exercise types
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
            </Pressable>

            <RowDivider color={theme.colors.border} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Adaptivity</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.mutedText }]}>
                  Adjusts difficulty and review timing based on your performance
                </Text>
              </View>
              <Switch
                value={adaptivity}
                onValueChange={async (v) => {
                  setAdaptivity(v);
                  await setAdaptivityEnabled(v);
                }}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>
          </SurfaceCard>
        </Section>

        <Section title="NOTIFICATIONS" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={async (v) => {
                  setNotifications(v);
                  await setNotificationsEnabled(v);
                }}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={async () => {
                await signOut();
                router.replace('/sign-in');
              }}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: theme.colors.error }]}>Sign out</Text>
              <Ionicons name="exit-outline" size={18} color={theme.colors.error} />
            </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    minHeight: 52,
  },
  rowLeft: {
    flex: 1,
    paddingRight: baseTheme.spacing.md,
    gap: 2,
  },
  rowTitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  rowSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: baseTheme.spacing.md,
  },
});
