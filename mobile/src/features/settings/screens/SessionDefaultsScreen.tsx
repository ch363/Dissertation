import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
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

export default function SessionDefaultsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const showBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showBack && (
          <IconButton
            accessibilityLabel="Back to Settings"
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={theme.colors.mutedText}
              accessible={false}
              importantForAccessibility="no"
            />
          </IconButton>
        )}

        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          Session defaults
        </Text>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mode</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Session mode"
            style={[styles.segmented, { borderColor: theme.colors.border }]}
          >
            {MODE_OPTIONS.map((opt) => {
              const selected = opt.value === mode;
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
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                      borderColor: theme.colors.border,
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
          {isLearnModeMissingLesson ? (
            <Text style={[styles.helper, { color: theme.colors.error }]}>
              Learn mode requires a lesson filter. Select a lesson below.
            </Text>
          ) : (
            <Text style={[styles.helper, { color: theme.colors.mutedText }]}>
              This controls what the backend prioritizes when building session plans.
            </Text>
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Time budget</Text>
            <Text style={[styles.valueText, { color: theme.colors.mutedText }]}>
              {formatBudget(timeBudgetSec)}
            </Text>
          </View>

          {timeBudgetSec ? (
            <>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear time budget"
                onPress={clearBudget}
                style={[styles.actionRow, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.actionText, { color: theme.colors.text }]}>No limit</Text>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.mutedText}
                  accessible={false}
                  importantForAccessibility="no"
                />
              </Pressable>
              <Text style={[styles.helper, { color: theme.colors.mutedText }]}>
                The planner will try to fit the session into this time.
              </Text>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enable time budget"
                onPress={() => setAndPersistBudgetMinutes(10)}
                style={[styles.actionRow, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.actionText, { color: theme.colors.text }]}>Set a limit</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.mutedText}
                  accessible={false}
                  importantForAccessibility="no"
                />
              </Pressable>
              <Text style={[styles.helper, { color: theme.colors.mutedText }]}>
                Optional pacing — leave off for open-ended sessions.
              </Text>
            </>
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Lesson filter</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose lesson filter"
            onPress={() => router.push(routes.tabs.settings.sessionLesson)}
            style={[styles.actionRow, { borderColor: theme.colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                {lessonTitle ? lessonTitle : lessonId ? lessonId : 'None'}
              </Text>
              <Text style={[styles.subText, { color: theme.colors.mutedText }]}>
                Used when generating session plans (especially Learn).
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.mutedText}
              accessible={false}
              importantForAccessibility="no"
            />
          </Pressable>

          {lessonId ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear lesson filter"
              onPress={clearLessonFilter}
              style={[styles.actionRow, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.actionText, { color: theme.colors.error }]}>Clear lesson filter</Text>
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.error}
                accessible={false}
                importantForAccessibility="no"
              />
            </Pressable>
          ) : (
            <Text style={[styles.helper, { color: theme.colors.mutedText }]}>
              Pick a lesson to focus sessions on a specific lesson.
            </Text>
          )}
        </View>
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
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 22,
  },
  section: {
    padding: baseTheme.spacing.lg,
    borderRadius: baseTheme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: baseTheme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  helper: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: baseTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: baseTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.sm,
    borderRadius: baseTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  subText: {
    marginTop: 2,
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
});

