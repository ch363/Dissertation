import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { ScrollView, SurfaceCard } from '@/components/ui';
import { routes } from '@/services/navigation/routes';
import {
  useAppTheme,
  getSessionDefaultMode,
  setSessionDefaultMode,
  getSessionDefaultTimeBudgetSec,
  setSessionDefaultTimeBudgetSec,
  getSessionDefaultLessonId,
  setSessionDefaultLessonId,
} from '@/services/preferences/settings-facade';
import { getLesson } from '@/services/api/modules';
import type { SessionDefaultMode } from '@/services/preferences';
import { theme as baseTheme } from '@/services/theme/tokens';

// Refined accent gradients for a premium settings feel
const ICON_GRADIENTS = {
  primary: ['#5B7CF4', '#264FD4'] as const,
  blue: ['#5AC8FA', '#007AFF'] as const,
  orange: ['#FFB340', '#FF8C00'] as const,
  purple: ['#C77CFF', '#9B59B6'] as const,
} as const;

const CARD_RADIUS = 18;
const ICON_BOX_SIZE = 36;
const ICON_BOX_RADIUS = 10;
const ROW_PADDING_V = 16;
const ROW_PADDING_H = 20;
const ROW_GAP = 16;
const TAB_BAR_HEIGHT = 84;
const SEGMENT_RADIUS = 12;

type ModeOption = { value: SessionDefaultMode; label: string };

const MODE_OPTIONS: ModeOption[] = [
  { value: 'learn', label: 'Learn' },
  { value: 'review', label: 'Review' },
  { value: 'mixed', label: 'Mixed' },
];

function formatBudget(timeBudgetSec: number | null) {
  if (!timeBudgetSec) return 'No limit';
  const minutes = Math.max(1, Math.round(timeBudgetSec / 60));
  return `${minutes} min`;
}

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

const iconStyles = StyleSheet.create({
  sectionWrap: { gap: baseTheme.spacing.md },
  sectionHeader: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: ICON_BOX_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function SessionDefaultsScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [mode, setMode] = useState<SessionDefaultMode>('mixed');
  const [timeBudgetSec, setTimeBudgetSecState] = useState<number | null>(null);
  const [lessonId, setLessonIdState] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);

  const timeBudgetMinutes = useMemo(() => {
    if (!timeBudgetSec) return 10;
    return Math.max(1, Math.min(60, Math.round(timeBudgetSec / 60)));
  }, [timeBudgetSec]);

  const isLearnModeMissingLesson = mode === 'learn' && !lessonId;

  const loadPrefs = useCallback(async () => {
    const [m, t, l] = await Promise.all([
      getSessionDefaultMode(),
      getSessionDefaultTimeBudgetSec(),
      getSessionDefaultLessonId(),
    ]);
    setMode(m);
    setTimeBudgetSecState(t);
    setLessonIdState(l);
  }, []);

  useEffect(() => {
    loadPrefs().catch(() => {});
  }, [loadPrefs]);

  // Refresh when returning from lesson picker
  useFocusEffect(
    useCallback(() => {
      loadPrefs().catch(() => {});
      return () => {};
    }, [loadPrefs]),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!lessonId) {
        setLessonTitle(null);
        return;
      }
      try {
        const lesson = await getLesson(lessonId);
        if (!cancelled) setLessonTitle(lesson?.title ?? null);
      } catch {
        if (!cancelled) setLessonTitle(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

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

  const setAndPersistMode = useCallback(
    async (next: SessionDefaultMode) => {
      if (next === 'learn' && !lessonId) {
        // Prevent invalid combo from being persisted; guide user to select a lesson first.
        router.push(routes.tabs.settings.sessionLesson);
        return;
      }
      setMode(next);
      await setSessionDefaultMode(next);
    },
    [lessonId],
  );

  const setAndPersistBudgetMinutes = useCallback(async (minutes: number) => {
    const clampedMin = Math.max(1, Math.min(60, Math.round(minutes)));
    const sec = clampedMin * 60;
    setTimeBudgetSecState(sec);
    await setSessionDefaultTimeBudgetSec(sec);
  }, []);

  const clearBudget = useCallback(async () => {
    setTimeBudgetSecState(null);
    await setSessionDefaultTimeBudgetSec(null);
  }, []);

  const clearLessonFilter = useCallback(async () => {
    setLessonIdState(null);
    setLessonTitle(null);
    await setSessionDefaultLessonId(null);
    if (mode === 'learn') {
      // If learn mode was active, fall back to mixed to stay valid.
      setMode('mixed');
      await setSessionDefaultMode('mixed');
    }
  }, [mode]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Session defaults"
        onBackPress={handleBack}
        backLabel="Settings"
        showHelp={false}
      />
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: baseTheme.spacing.xl + insets.bottom + TAB_BAR_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode */}
        <Section title="MODE" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <View style={styles.settingRow}>
              <SettingIconBox colors={ICON_GRADIENTS.primary}>
                <Ionicons name="shuffle-outline" size={20} color="#FFFFFF" />
              </SettingIconBox>
              <View style={styles.settingRowContent}>
                <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>Mode</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.segmentedWrap}>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="Session mode"
                style={[styles.segmented, { backgroundColor: theme.colors.border }]}
              >
                {MODE_OPTIONS.map((opt, index) => {
                  const selected = opt.value === mode;
                  const isFirst = index === 0;
                  const isLast = index === MODE_OPTIONS.length - 1;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="radio"
                      accessibilityLabel={opt.label}
                      accessibilityHint="Sets the default session mode"
                      accessibilityState={{ selected }}
                      onPress={() => setAndPersistMode(opt.value)}
                      style={[
                        styles.segment,
                        isFirst && styles.segmentFirst,
                        isLast && styles.segmentLast,
                        {
                          backgroundColor: selected ? theme.colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentLabel,
                          { color: selected ? theme.colors.onPrimary : theme.colors.text },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {isLearnModeMissingLesson ? (
              <Text style={[styles.helper, { color: theme.colors.error }, styles.helperPad]}>
                Learn mode requires a lesson filter. Select a lesson below.
              </Text>
            ) : (
              <Text style={[styles.helper, { color: theme.colors.mutedText }, styles.helperPad]}>
                This controls what the backend prioritizes when building session plans.
              </Text>
            )}
          </SurfaceCard>
        </Section>

        {/* Time budget */}
        <Section title="TIME BUDGET" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <View style={styles.settingRow}>
              <SettingIconBox colors={ICON_GRADIENTS.orange}>
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              </SettingIconBox>
              <View style={styles.settingRowContent}>
                <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>Time budget</Text>
                <Text style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]}>
                  {formatBudget(timeBudgetSec)}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            {timeBudgetSec ? (
              <>
                <View style={styles.sliderWrap}>
                  <Slider
                    value={timeBudgetMinutes}
                    onValueChange={(v: number) => setTimeBudgetSecState(Math.round(v) * 60)}
                    onSlidingComplete={(v: number) => setAndPersistBudgetMinutes(v)}
                    minimumValue={1}
                    maximumValue={60}
                    step={1}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                    accessibilityLabel="Time budget"
                    accessibilityHint="Adjusts the session time limit"
                    accessibilityValue={{ text: formatBudget(timeBudgetSecState ?? timeBudgetSec ?? null) }}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear time budget"
                  onPress={clearBudget}
                  style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                >
                  <Text style={[styles.actionRowLabel, { color: theme.colors.text }]}>No limit</Text>
                  <Ionicons name="close-circle-outline" size={20} color={theme.colors.mutedText} />
                </Pressable>
                <Text style={[styles.helper, { color: theme.colors.mutedText }, styles.helperPad]}>
                  The planner will try to fit the session into this time.
                </Text>
              </>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enable time budget"
                  onPress={() => setAndPersistBudgetMinutes(10)}
                  style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                >
                  <Text style={[styles.actionRowLabel, { color: theme.colors.text }]}>Set a limit</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
                </Pressable>
                <Text style={[styles.helper, { color: theme.colors.mutedText }, styles.helperPad]}>
                  Optional pacing — leave off for open-ended sessions.
                </Text>
              </>
            )}
          </SurfaceCard>
        </Section>

        {/* Lesson filter */}
        <Section title="LESSON FILTER" color={theme.colors.mutedText}>
          <SurfaceCard style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose lesson filter"
              onPress={() => router.push(routes.tabs.settings.sessionLesson)}
              style={({ pressed }) => [styles.settingRow, pressed && styles.actionRowPressed]}
            >
              <SettingIconBox colors={ICON_GRADIENTS.purple}>
                <Ionicons name="book-outline" size={20} color="#FFFFFF" />
              </SettingIconBox>
              <View style={styles.settingRowContent}>
                <Text style={[styles.settingRowLabel, { color: theme.colors.text }]}>
                  {lessonTitle ?? (lessonId ? lessonId : 'None')}
                </Text>
                <Text style={[styles.settingRowSubtitle, { color: theme.colors.mutedText }]}>
                  Used when generating session plans (especially Learn).
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
            </Pressable>
            {lessonId ? (
              <>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear lesson filter"
                  onPress={clearLessonFilter}
                  style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                >
                  <Text style={[styles.actionRowLabel, { color: theme.colors.error }]}>Clear lesson filter</Text>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </Pressable>
              </>
            ) : (
              <Text style={[styles.helper, { color: theme.colors.mutedText }, styles.helperPad]}>
                Pick a lesson to focus sessions on a specific lesson.
              </Text>
            )}
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
    paddingHorizontal: baseTheme.spacing.lg,
    gap: 24,
    paddingTop: baseTheme.spacing.sm,
  },
  card: {
    padding: 0,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
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
  segmentedWrap: {
    paddingHorizontal: ROW_PADDING_H,
    paddingTop: baseTheme.spacing.sm,
    paddingBottom: baseTheme.spacing.xs,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ROW_PADDING_V,
    paddingHorizontal: ROW_PADDING_H,
    gap: ROW_GAP,
    minHeight: 52,
  },
  actionRowLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 17,
  },
  actionRowPressed: {
    opacity: 0.9,
  },
  sliderWrap: {
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: baseTheme.spacing.sm,
  },
});

