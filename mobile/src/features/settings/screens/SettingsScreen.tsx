import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaticCard } from '@/components/ui';
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

// iOS-style accent colors for icon boxes (work in light and dark)
const ICON_GRADIENTS = {
  primary: ['#4D74ED', '#264FD4'] as const,
  blue: ['#5AC8FA', '#007AFF'] as const,
  orange: ['#FF9F0A', '#FF6B00'] as const,
  purple: ['#BF5AF2', '#8E44AD'] as const,
  red: ['#FF453A', '#D32F2F'] as const,
} as const;

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

type SettingIconBoxProps = {
  colors: readonly [string, string];
  children: ReactNode;
};

function SettingIconBox({ colors, children }: SettingIconBoxProps) {
  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.iconBox}
    >
      {children}
    </LinearGradient>
  );
}

type SettingToggleRowProps = {
  icon: ReactNode;
  iconColors: readonly [string, string];
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
  trackColor?: string;
};

function SettingToggleRow({
  icon,
  iconColors,
  label,
  subtitle,
  value,
  onValueChange,
  accessibilityLabel,
  trackColor,
}: SettingToggleRowProps) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.settingRow}>
      <SettingIconBox colors={iconColors}>{icon}</SettingIconBox>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: value }}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: trackColor ?? theme.colors.success, false: theme.colors.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

type SettingNavRowProps = {
  icon: ReactNode;
  iconColors: readonly [string, string];
  label: string;
  subtitle?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

function SettingNavRow({
  icon,
  iconColors,
  label,
  subtitle,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: SettingNavRowProps) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <SettingIconBox colors={iconColors}>{icon}</SettingIconBox>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
    </Pressable>
  );
}

// Tab bar is absolutely positioned; reserve space so scroll content can clear it
const TAB_BAR_HEIGHT = 84;

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [adaptivity, setAdaptivity] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setAdaptivity(await getAdaptivityEnabled());
      setNotifications(await getNotificationsEnabled());
    })();
  }, []);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        styles.scrollContent,
        {
          paddingTop: insets.top,
          paddingBottom: baseTheme.spacing.xl + insets.bottom + TAB_BAR_HEIGHT,
          paddingLeft: baseTheme.spacing.lg + insets.left,
          paddingRight: baseTheme.spacing.lg + insets.right,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
          </Pressable>

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
            <Text style={[styles.intro, { color: theme.colors.mutedText }]}>
              Tailor Fluentia to how you learn best
            </Text>
          </View>
        </View>

        {/* Help - placed high so it's visible without scrolling */}
        <Section title="HELP" color={theme.colors.mutedText}>
          <StaticCard style={styles.card}>
            <SettingNavRow
              icon={<Ionicons name="book-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.blue}
              label="Help"
              subtitle="Getting started and tips for success"
              onPress={() => router.push(routes.tabs.settings.help)}
              accessibilityLabel="Open Help"
              accessibilityHint="View getting started and tips"
            />
            <SettingNavRow
              icon={<Ionicons name="help-circle-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.blue}
              label="FAQ"
              subtitle="Frequently asked questions"
              onPress={() => router.push(routes.tabs.settings.faq)}
              accessibilityLabel="Open FAQ"
              accessibilityHint="View frequently asked questions"
            />
          </StaticCard>
        </Section>

        {/* Appearance */}
        <Section title="APPEARANCE" color={theme.colors.mutedText}>
          <StaticCard style={styles.card}>
            <SettingToggleRow
              icon={<Ionicons name="moon-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.primary}
              label="Dark Mode"
              value={isDark}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              accessibilityLabel="Dark Mode"
              trackColor={theme.colors.success}
            />
          </StaticCard>
        </Section>

        {/* Learning */}
        <Section title="LEARNING" color={theme.colors.mutedText}>
          <StaticCard style={styles.cardLearning}>
            <SettingNavRow
              icon={<Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.blue}
              label="Speech"
              onPress={() => router.push(routes.tabs.settings.speech)}
              accessibilityLabel="Open Speech Settings"
              accessibilityHint="Configure text to speech and speed"
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingNavRow
              icon={<Ionicons name="time-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.orange}
              label="Session defaults"
              subtitle="Preferred session length and exercise types"
              onPress={() => router.push(routes.tabs.settings.session)}
              accessibilityLabel="Open Session defaults"
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingToggleRow
              icon={<Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.purple}
              label="Adaptivity"
              subtitle="Adjusts difficulty and review timing based on your performance"
              value={adaptivity}
              onValueChange={async (v) => {
                setAdaptivity(v);
                await setAdaptivityEnabled(v);
              }}
              accessibilityLabel="Adaptivity"
              trackColor={theme.colors.success}
            />
          </StaticCard>
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS" color={theme.colors.mutedText}>
          <StaticCard style={styles.card}>
            <SettingToggleRow
              icon={<Ionicons name="notifications-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.red}
              label="Notifications"
              value={notifications}
              onValueChange={async (v) => {
                setNotifications(v);
                await setNotificationsEnabled(v);
              }}
              accessibilityLabel="Notifications"
              trackColor={theme.colors.success}
            />
          </StaticCard>
        </Section>

        {/* Account */}
        <Section title="ACCOUNT" color={theme.colors.mutedText}>
          <StaticCard
            style={[
              styles.card,
              styles.accountCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
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
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              accessibilityHint="Signs you out of your account"
            >
              <SettingIconBox colors={ICON_GRADIENTS.red}>
                <Ionicons name="exit-outline" size={18} color="#FFFFFF" />
              </SettingIconBox>
              <View style={styles.settingRowContent}>
                <Text style={[styles.settingRowLabel, { color: theme.colors.error }]}>Sign out</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
            </Pressable>
          </StaticCard>
        </Section>
    </ScrollView>
  );
}

const CARD_RADIUS = 14;
const ICON_BOX_SIZE = 29;
const ICON_BOX_RADIUS = 7;
const ROW_PADDING_V = 11;
const ROW_PADDING_H = 16;
const ROW_GAP = 14;

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingBottom: baseTheme.spacing.xl,
    gap: 20,
  },
  header: {
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: baseTheme.spacing.xs,
    marginLeft: -baseTheme.spacing.xs,
    marginBottom: 4,
  },
  titleRow: {
    gap: 4,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 34,
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  intro: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 20,
    opacity: 0.7,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeader: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardLearning: {
    padding: 0,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountCard: {
    borderRadius: CARD_RADIUS,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ROW_PADDING_V,
    paddingHorizontal: ROW_PADDING_H,
    gap: ROW_GAP,
    minHeight: 52,
  },
  settingRowPressed: {
    opacity: 0.9,
  },
  settingRowContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  settingRowLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 17,
  },
  settingRowSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: ICON_BOX_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: ROW_PADDING_H + ICON_BOX_SIZE + ROW_GAP,
  },
});
