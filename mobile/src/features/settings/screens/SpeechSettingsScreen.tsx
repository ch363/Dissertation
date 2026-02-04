import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation';
import { ScrollView, StaticCard } from '@/components/ui';
import { routes } from '@/services/navigation/routes';
import {
  useAppTheme,
  getTtsEnabled,
  setTtsEnabled,
  getTtsRate,
  setTtsRate,
} from '@/services/preferences/settings-facade';
import { theme as baseTheme } from '@/services/theme/tokens';

const ICON_GRADIENTS = {
  blue: ['#5AC8FA', '#007AFF'] as const,
  purple: ['#BF5AF2', '#8E44AD'] as const,
} as const;

const ICON_BOX_SIZE = 29;
const ICON_BOX_RADIUS = 7;
const ROW_PADDING_V = 11;
const ROW_PADDING_H = 16;
const ROW_GAP = 14;
const TAB_BAR_HEIGHT = 84;

function SettingIconBox({
  colors,
  children,
}: {
  colors: readonly [string, string];
  children: ReactNode;
}) {
  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={iconStyles.iconBox}
    >
      {children}
    </LinearGradient>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <View style={iconStyles.sectionWrap}>
      <Text style={[iconStyles.sectionHeader, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

// Reusable row components — add new voice settings by dropping in another row.

type SettingToggleRowProps = {
  icon: ReactNode;
  iconColors: readonly [string, string];
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
};

function SettingToggleRow({
  icon,
  iconColors,
  label,
  subtitle,
  value,
  onValueChange,
  accessibilityLabel,
}: SettingToggleRowProps) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.settingRow}>
      <SettingIconBox colors={iconColors}>{icon}</SettingIconBox>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text
            style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]}
            numberOfLines={2}
          >
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
        trackColor={{ true: theme.colors.success, false: theme.colors.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

type SettingSliderRowProps = {
  icon: ReactNode;
  iconColors: readonly [string, string];
  label: string;
  subtitle?: string;
  value: number;
  onValueChange: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
  min: number;
  max: number;
  step: number;
  helperText?: string;
  accessibilityLabel: string;
  accessibilityValueText?: string;
};

function SettingSliderRow({
  icon,
  iconColors,
  label,
  subtitle,
  value,
  onValueChange,
  onSlidingComplete,
  min,
  max,
  step,
  helperText,
  accessibilityLabel,
  accessibilityValueText,
}: SettingSliderRowProps) {
  const { theme } = useAppTheme();
  return (
    <>
      <View style={styles.settingRow}>
        <SettingIconBox colors={iconColors}>{icon}</SettingIconBox>
        <View style={styles.settingRowContent}>
          <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>{label}</Text>
          {subtitle ? (
            <Text
              style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.sliderWrap}>
        <Slider
          value={value}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          minimumValue={min}
          maximumValue={max}
          step={step}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ text: accessibilityValueText }}
        />
      </View>
      {helperText ? (
        <Text style={[styles.helper, { color: theme.colors.mutedText }, styles.helperPad]}>
          {helperText}
        </Text>
      ) : null}
    </>
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
          <Text
            style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
    </Pressable>
  );
}

const iconStyles = StyleSheet.create({
  sectionWrap: { gap: baseTheme.spacing.sm },
  sectionHeader: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: ICON_BOX_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function SpeechSettings() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [enabled, setEnabled] = useState(true);
  const [rate, setRate] = useState(0.95);

  useEffect(() => {
    (async () => {
      const [e, r] = await Promise.all([getTtsEnabled(), getTtsRate()]);
      setEnabled(e);
      setRate(r);
    })();
  }, []);

  const handleBack = useCallback(() => {
    try {
      // @ts-ignore
      if (navigation?.canGoBack?.()) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    router.replace(routes.tabs.settings.root);
  }, [navigation]);

  const handleVoicePress = useCallback(() => {}, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Speech" onBackPress={handleBack} backLabel="Settings" showHelp={false} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: baseTheme.spacing.xl + insets.bottom + TAB_BAR_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Playback: TTS on/off, speed. */}
        <Section title="PLAYBACK" color={theme.colors.mutedText}>
          <StaticCard style={styles.card}>
            <SettingToggleRow
              icon={<Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.blue}
              label="Enable TTS"
              subtitle="Text to speech for prompts"
              value={enabled}
              onValueChange={async (next) => {
                setEnabled(next);
                await setTtsEnabled(next);
              }}
              accessibilityLabel="Enable speech"
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingSliderRow
              icon={<Ionicons name="speedometer-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.blue}
              label="Speed"
              subtitle="Playback rate"
              value={rate}
              onValueChange={setRate}
              onSlidingComplete={async (v) => await setTtsRate(v)}
              min={0.5}
              max={1.0}
              step={0.01}
              helperText="Slower can improve clarity for new words."
              accessibilityLabel="Speech speed"
              accessibilityValueText={`${Math.round(rate * 100)} percent`}
            />
          </StaticCard>
        </Section>

        {/* Voice: voice selection, language, pitch, etc. — extend by adding more rows. */}
        <Section title="VOICE" color={theme.colors.mutedText}>
          <StaticCard style={styles.card}>
            <SettingNavRow
              icon={<Ionicons name="person-circle-outline" size={18} color="#FFFFFF" />}
              iconColors={ICON_GRADIENTS.purple}
              label="Voice"
              subtitle="System default"
              onPress={handleVoicePress}
              accessibilityLabel="Choose voice"
              accessibilityHint="Opens voice selection when available"
            />
            {/* Future: add rows for Language, Pitch, Accent, etc. */}
            {/* <View style={[styles.divider, { backgroundColor: theme.colors.border }]} /> */}
            {/* <SettingNavRow ... label="Language" subtitle="..." onPress={...} /> */}
          </StaticCard>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: baseTheme.spacing.lg,
    gap: 24,
    paddingTop: baseTheme.spacing.sm,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: ROW_PADDING_H + ICON_BOX_SIZE + ROW_GAP,
  },
  helper: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  helperPad: {
    paddingHorizontal: ROW_PADDING_H,
    paddingBottom: ROW_PADDING_H,
  },
  sliderWrap: {
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: baseTheme.spacing.sm,
  },
});
