import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { LoadingScreen } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionRunner } from '@/features/session/components/SessionRunner';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { AttemptLog, SessionKind, SessionPlan } from '@/types/session';
import { getSessionPlan } from '@/services/api/learn';
import { startLesson } from '@/services/api/progress';
import { transformSessionPlan } from '@/services/api/session-plan-transformer';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';
import {
  getSessionDefaultLessonId,
  getSessionDefaultMode,
  getSessionDefaultTimeBudgetSec,
} from '@/services/preferences/settings-facade';

type Props = {
  lessonId?: string;
  moduleId?: string;
  sessionId?: string;
  kind?: SessionKind;
  returnTo?: string;
};

export default function SessionRunnerScreen(props?: Props) {
  const params = useLocalSearchParams<{
    sessionId?: string;
    lessonId?: string;
    moduleId?: string;
    kind?: string;
    returnTo?: string;
  }>();

  // Use useState with lazy initializer to prevent infinite re-renders
  // makeSessionId generates a new ID each time, so we only call it once on mount
  const [sessionId] = useState(
    () => props?.sessionId ?? (params.sessionId as string | undefined) ?? makeSessionId('session'),
  );
  const requestedKind: SessionKind = props?.kind ?? (params.kind === 'review' ? 'review' : 'learn');
  const requestedLessonId = props?.lessonId ?? (params.lessonId as string | undefined);
  const moduleId = props?.moduleId ?? (params.moduleId as string | undefined);
  const returnTo = props?.returnTo ?? (params.returnTo as string | undefined);

  const { theme } = useAppTheme();
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedKind, setResolvedKind] = useState<SessionKind>(requestedKind);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | undefined>(requestedLessonId);
  const [resolvedMode, setResolvedMode] = useState<'learn' | 'review' | 'mixed'>('mixed');
  const [resolvedTimeBudgetSec, setResolvedTimeBudgetSec] = useState<number | null>(null);
  
  // Animation for slide-up transition
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Trigger slide-up animation when content is ready
  // Note: TTS is now preloaded at app startup, so no need to warmup here
  useEffect(() => {
    if (plan && !loading && !error) {
      // Start animation when content is ready
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation when loading or error
      slideAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [plan, loading, error, slideAnim, opacityAnim]);

  useEffect(() => {
    let cancelled = false;

    const loadSessionPlan = async () => {
      // Load session defaults (mode, timeBudget, optional lesson filter)
      const [defaultMode, defaultTimeBudgetSec, defaultLessonFilter] = await Promise.all([
        getSessionDefaultMode(),
        getSessionDefaultTimeBudgetSec(),
        getSessionDefaultLessonId(),
      ]);

      // For review sessions, avoid implicitly scoping by the user's default lesson filter.
      // Only scope reviews if an explicit lessonId/moduleId is provided via params.
      const effectiveLessonId =
        requestedKind === 'review' ? requestedLessonId ?? undefined : requestedLessonId ?? defaultLessonFilter ?? undefined;

      // Respect explicit request intent over saved defaults:
      // - Review CTA must always start a review-mode plan
      // - Explicit lessonId implies a learn-mode plan (lesson-scoped)
      const effectiveMode: 'learn' | 'review' | 'mixed' =
        requestedKind === 'review'
          ? 'review'
          : requestedLessonId
            ? 'learn'
            : defaultMode;
      const effectiveKind: SessionKind = effectiveMode === 'review' ? 'review' : 'learn'; // mixed behaves like learn in UI

      setResolvedKind(effectiveKind);
      setResolvedLessonId(effectiveLessonId);
      setResolvedMode(effectiveMode);
      setResolvedTimeBudgetSec(defaultTimeBudgetSec);

      // Guardrail: learn mode needs a lesson filter.
      if (effectiveMode === 'learn' && !effectiveLessonId) {
        setPlan(null);
        setLoading(false);
        setError('Learn mode requires a lesson filter. Set one in Settings → Session defaults.');
        return;
      }

      // Check cache first for lesson-scoped sessions
      if (effectiveKind === 'learn' && effectiveLessonId) {
        const cachedPlan = getCachedSessionPlan({
          lessonId: effectiveLessonId,
          mode: effectiveMode,
          timeBudgetSec: defaultTimeBudgetSec,
        });
        if (cachedPlan) {
          console.log('Using cached session plan for lesson:', effectiveLessonId);
          setPlan(cachedPlan);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        // Start lesson engagement (creates/updates UserLesson) for learn-like sessions
        if (effectiveKind === 'learn' && effectiveLessonId) {
          try {
            await startLesson(effectiveLessonId);
          } catch (err) {
            console.error('Failed to start lesson:', err);
            // Continue even if this fails - non-critical
          }
        }

        // Fetch session plan using effective defaults
        const response = await getSessionPlan({
          mode: effectiveMode,
          timeBudgetSec: defaultTimeBudgetSec ?? undefined,
          lessonId: effectiveLessonId,
          moduleId,
        });

        if (cancelled) return;

        // Handle API response wrapper (success/data structure)
        const planData = response?.data || response;

        console.log('Session plan response:', {
          hasData: !!planData,
          hasSteps: !!planData?.steps,
          stepsLength: planData?.steps?.length,
          firstStep: planData?.steps?.[0],
        });

        // Transform backend session plan (steps) to frontend format (cards)
        if (planData && planData.steps && Array.isArray(planData.steps) && planData.steps.length > 0) {
          const transformedPlan = transformSessionPlan(planData, sessionId);
          console.log('Transformed plan:', {
            cardsCount: transformedPlan.cards.length,
            cardTypes: transformedPlan.cards.map((c) => c.kind),
          });

          if (cancelled) return;

          if (transformedPlan.cards.length > 0) {
            setPlan(transformedPlan);
          } else {
            // If no cards (e.g., only recap steps), redirect directly to summary
            console.log('Session plan has no practice cards. Redirecting to summary.');
            router.replace({
              pathname: routeBuilders.sessionSummary(sessionId),
              params: {
                kind: effectiveKind,
                lessonId: effectiveLessonId,
                planMode: effectiveMode,
                timeBudgetSec: defaultTimeBudgetSec ? String(defaultTimeBudgetSec) : '',
                ...(returnTo ? { returnTo } : {}),
              },
            });
            return;
          }
        } else {
          console.error('Invalid plan data:', {
            hasPlanData: !!planData,
            hasSteps: !!planData?.steps,
            stepsLength: planData?.steps?.length,
            planDataKeys: planData ? Object.keys(planData) : [],
          });
          if (!cancelled) {
            setError(`Unable to load session plan - no steps found`);
          }
        }
      } catch (err: any) {
        console.error('Failed to load session plan:', err);
        if (!cancelled) {
          const msg = err?.message ?? '';
          const needsOnboarding =
            typeof msg === 'string' &&
            (msg.includes('does not have onboarding data') || msg.includes('must complete onboarding'));
          if (needsOnboarding) {
            router.replace('/(onboarding)/welcome');
            return;
          }
          setError(msg || 'Failed to load session');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSessionPlan();

    return () => {
      cancelled = true;
    };
  }, [requestedLessonId, moduleId, sessionId, requestedKind]);

  const handleComplete = async (attempts: AttemptLog[]) => {
    // Note: Question attempts are now recorded immediately in SessionRunner
    // when answers are validated, so we don't need to record them here.
    // This avoids duplicate records and ensures real-time progress tracking.
    router.replace({
      pathname: routeBuilders.sessionSummary(sessionId),
      params: {
        kind: resolvedKind,
        lessonId: resolvedLessonId,
        planMode: resolvedMode,
        timeBudgetSec: resolvedTimeBudgetSec ? String(resolvedTimeBudgetSec) : '',
        ...(returnTo ? { returnTo } : {}),
      },
    });
  };

  // Calculate translateY for slide-up animation
  // Start from bottom of screen
  const screenHeight = Dimensions.get('window').height;
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0], // Slide up from bottom of screen
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? (
        <LoadingScreen
          title="Preparing your session..."
          subtitle="Please wait while we load your exercises."
          safeArea={false}
        />
      ) : error || !plan ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: theme.colors.error, marginBottom: 10 }}>
            {error || 'Failed to load session'}
          </Text>
        </View>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY }],
            opacity: opacityAnim,
            backgroundColor: theme.colors.background,
          }}
        >
          <SessionRunner 
            plan={plan} 
            sessionId={sessionId}
            kind={resolvedKind}
            lessonId={resolvedLessonId}
            planMode={resolvedMode}
            timeBudgetSec={resolvedTimeBudgetSec}
            returnTo={returnTo}
            onComplete={handleComplete} 
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
