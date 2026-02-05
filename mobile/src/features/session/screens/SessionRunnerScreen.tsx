import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui';
import { SessionRunner } from '@/features/session/components/SessionRunner';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { getSessionPlan } from '@/services/api/learn';
import { startLesson, endLesson } from '@/services/api/progress';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';
import { transformSessionPlan } from '@/services/api/session-plan-transformer';
import { createLogger } from '@/services/logging';
import { routeBuilders } from '@/services/navigation/routes';
import {
  getSessionDefaultLessonId,
  getSessionDefaultMode,
  getSessionDefaultTimeBudgetSec,
} from '@/services/preferences/settings-facade';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { AttemptLog, SessionKind, SessionPlan } from '@/types/session';

const logger = createLogger('SessionRunnerScreen');

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

  const [sessionId] = useState(
    () => props?.sessionId ?? (params.sessionId as string | undefined) ?? makeSessionId('session'),
  );
  const requestedKind: SessionKind = props?.kind ?? (params.kind === 'review' ? 'review' : 'learn');
  const requestedLessonId = props?.lessonId ?? (params.lessonId as string | undefined);
  const moduleId = props?.moduleId ?? (params.moduleId as string | undefined);
  const returnTo = props?.returnTo ?? (params.returnTo as string | undefined);

  const { theme } = useAppTheme();
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedKind, setResolvedKind] = useState<SessionKind>(requestedKind);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | undefined>(requestedLessonId);
  const [resolvedMode, setResolvedMode] = useState<'learn' | 'review' | 'mixed'>('mixed');
  const [resolvedTimeBudgetSec, setResolvedTimeBudgetSec] = useState<number | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const lessonStartedRef = useRef<string | null>(null);

  useEffect(() => {
    if (plan && !loading && !error) {
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
      slideAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [plan, loading, error, slideAnim, opacityAnim]);

  useEffect(() => {
    let cancelled = false;

    const loadSessionPlan = async () => {
      const [defaultMode, defaultTimeBudgetSec, defaultLessonFilter] = await Promise.all([
        getSessionDefaultMode(),
        getSessionDefaultTimeBudgetSec(),
        getSessionDefaultLessonId(),
      ]);

      const effectiveLessonId =
        requestedKind === 'review'
          ? (requestedLessonId ?? undefined)
          : (requestedLessonId ?? defaultLessonFilter ?? undefined);

      const effectiveMode: 'learn' | 'review' | 'mixed' =
        requestedKind === 'review' ? 'review' : requestedLessonId ? 'learn' : defaultMode;
      const effectiveKind: SessionKind = effectiveMode === 'review' ? 'review' : 'learn';

      setResolvedKind(effectiveKind);
      setResolvedLessonId(effectiveLessonId);
      setResolvedMode(effectiveMode);
      setResolvedTimeBudgetSec(defaultTimeBudgetSec);

      if (effectiveMode === 'learn' && !effectiveLessonId) {
        setPlan(null);
        setLoading(false);
        setError('Learn mode requires a lesson filter. Set one in Settings → Session defaults.');
        return;
      }

      if (effectiveKind === 'learn' && effectiveLessonId) {
        const cachedPlan = getCachedSessionPlan({
          lessonId: effectiveLessonId,
          mode: effectiveMode,
          timeBudgetSec: defaultTimeBudgetSec,
        });
        if (cachedPlan) {
          logger.debug('Using cached session plan for lesson', { lessonId: effectiveLessonId });
          setPlan(cachedPlan);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        if (effectiveKind === 'learn' && effectiveLessonId) {
          try {
            await startLesson(effectiveLessonId);
            lessonStartedRef.current = effectiveLessonId;
          } catch (err) {
            logger.error('Failed to start lesson', err);
          }
        }

        const response = await getSessionPlan({
          mode: effectiveMode,
          timeBudgetSec: defaultTimeBudgetSec ?? undefined,
          lessonId: effectiveLessonId,
          moduleId,
        });

        if (cancelled) return;

        const planData = response?.data || response;

        logger.debug('Session plan response', {
          hasData: !!planData,
          hasSteps: !!planData?.steps,
          stepsLength: planData?.steps?.length,
          firstStep: planData?.steps?.[0],
        });

        if (
          planData &&
          planData.steps &&
          Array.isArray(planData.steps) &&
          planData.steps.length > 0
        ) {
          const transformedPlan = transformSessionPlan(planData, sessionId);
          logger.debug('Transformed plan', {
            cardsCount: transformedPlan.cards.length,
            cardTypes: transformedPlan.cards.map((c) => c.kind),
          });

          if (cancelled) return;

          if (transformedPlan.cards.length > 0) {
            setPlan(transformedPlan);
          } else {
            logger.debug('Session plan has no practice cards. Redirecting to summary.');
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
          }
        } else {
          logger.error('Invalid plan data', undefined, {
            hasPlanData: !!planData,
            hasSteps: !!planData?.steps,
            stepsLength: planData?.steps?.length,
            planDataKeys: planData ? Object.keys(planData) : [],
          });
          if (!cancelled) {
            setError(`Unable to load session plan - no steps found`);
          }
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to load session plan', error);
        if (!cancelled) {
          const msg = error.message;
          const needsOnboarding =
            msg.includes('does not have onboarding data') ||
            msg.includes('must complete onboarding');
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
      const lessonId = lessonStartedRef.current;
      if (lessonId) {
        lessonStartedRef.current = null;
        endLesson(lessonId).catch((err) => logger.error('Failed to end lesson', err));
      }
    };
  }, [requestedLessonId, moduleId, sessionId, requestedKind, returnTo]);

  const handleComplete = async (_attempts: AttemptLog[]) => {
    if (resolvedKind === 'learn' && resolvedLessonId) {
      lessonStartedRef.current = null;
      endLesson(resolvedLessonId).catch((err) => logger.error('Failed to end lesson', err));
    }
    // SessionRunner already navigates to summary with full params (reviewedTeachings, totalXp, teachingsMastered).
    // Do not replace here or we overwrite those params and the summary list stays empty.
  };

  const screenHeight = Dimensions.get('window').height;
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? (
        <LoadingScreen
          title="Preparing your session..."
          subtitle="Please wait while we load your exercises."
          safeArea={false}
          showLogo
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
