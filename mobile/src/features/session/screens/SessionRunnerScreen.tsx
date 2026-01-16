import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, Text, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionRunner } from '@/features/session/components/SessionRunner';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { AttemptLog, SessionKind, SessionPlan, CardKind } from '@/types/session';
import { getSessionPlan } from '@/services/api/learn';
import { startLesson } from '@/services/api/progress';
import { transformSessionPlan } from '@/services/api/session-plan-transformer';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';

type Props = {
  lessonId?: string;
  sessionId?: string;
  kind?: SessionKind;
};

export default function SessionRunnerScreen(props?: Props) {
  const params = useLocalSearchParams<{
    sessionId?: string;
    lessonId?: string;
    kind?: string;
  }>();

  // Use useState with lazy initializer to prevent infinite re-renders
  // makeSessionId generates a new ID each time, so we only call it once on mount
  const [sessionId] = useState(
    () => props?.sessionId ?? (params.sessionId as string | undefined) ?? makeSessionId('session'),
  );
  const sessionKind: SessionKind = props?.kind ?? (params.kind === 'review' ? 'review' : 'learn');
  const lessonId = props?.lessonId ?? (params.lessonId as string | undefined) ?? 'demo';

  const { theme } = useAppTheme();
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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
      // Check cache first for learn sessions
      if (sessionKind === 'learn' && lessonId && lessonId !== 'demo') {
        const cachedPlan = getCachedSessionPlan(lessonId);
        if (cachedPlan) {
          console.log('Using cached session plan for lesson:', lessonId);
          setPlan(cachedPlan);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        if (sessionKind === 'review') {
          // For review sessions, fetch from backend
          const response = await getSessionPlan({
            mode: 'review',
          });
          
          if (cancelled) return;
          
          const planData = response?.data || response;
          const transformedPlan = transformSessionPlan(planData, sessionId);
          
          if (cancelled) return;
          
          if (transformedPlan.cards.length > 0) {
            setPlan(transformedPlan);
          } else {
            console.error('Review session plan has no cards');
            setError('No review items available');
          }
          setLoading(false);
          return;
        }

        // For learn sessions, fetch from backend
        if (lessonId && lessonId !== 'demo') {
          // Start lesson engagement (creates/updates UserLesson)
          try {
            await startLesson(lessonId);
          } catch (err) {
            console.error('Failed to start lesson:', err);
            // Continue even if this fails - non-critical
          }

          const response = await getSessionPlan({
            mode: 'learn',
            lessonId,
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
              cardTypes: transformedPlan.cards.map(c => c.kind),
            });
            
            if (!cancelled) {
              if (transformedPlan.cards.length > 0) {
                setPlan(transformedPlan);
              } else {
                // If no cards (e.g., only recap steps), lesson is likely completed
                // Redirect directly to summary screen instead of showing error
                console.log('Session plan has no practice cards (lesson completed or only recap). Redirecting to summary.');
                router.replace({
                  pathname: routeBuilders.sessionSummary(sessionId),
                  params: { kind: sessionKind, lessonId },
                });
                return;
              }
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
        } else {
          if (!cancelled) {
            setError('Lesson ID is required');
          }
        }
      } catch (err: any) {
        console.error('Failed to load session plan:', err);
        if (!cancelled) {
          setError(err?.message || 'Failed to load session');
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
  }, [lessonId, sessionId, sessionKind]);

  const handleComplete = async (attempts: AttemptLog[]) => {
    // Note: Question attempts are now recorded immediately in SessionRunner
    // when answers are validated, so we don't need to record them here.
    // This avoids duplicate records and ensures real-time progress tracking.
    router.replace({
      pathname: routeBuilders.sessionSummary(sessionId),
      params: { kind: sessionKind, lessonId },
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : error || !plan ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: theme.colors.error, marginBottom: 10 }}>
            {error || 'Failed to load session'}
          </Text>
          <ActivityIndicator color={theme.colors.error} />
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
            kind={sessionKind}
            lessonId={lessonId}
            onComplete={handleComplete} 
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
