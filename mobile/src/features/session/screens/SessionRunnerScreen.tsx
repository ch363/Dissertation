import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionRunner } from '@/features/session/components/SessionRunner';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { AttemptLog, SessionKind, SessionPlan } from '@/types/session';
import { getSessionPlan } from '@/services/api/learn';
import { recordQuestionAttempt } from '@/services/api/progress';
import { transformSessionPlan } from '@/services/api/session-plan-transformer';

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

  useEffect(() => {
    let cancelled = false;

    const loadSessionPlan = async () => {
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
                console.error('Transformation produced no cards. Steps:', planData.steps);
                setError('Session plan has no cards after transformation');
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
    try {
      // Log question attempts to backend
      for (const attempt of attempts) {
        // Extract questionId from cardId if possible, or use a mapping
        // For now, we'll skip if we can't determine the questionId
        if (attempt.cardId && attempt.cardId.startsWith('question-')) {
          const questionId = attempt.cardId.replace('question-', '');
          await recordQuestionAttempt(questionId, {
            score: attempt.isCorrect ? 100 : 0,
            timeToComplete: attempt.elapsedMs,
            percentageAccuracy: attempt.isCorrect ? 100 : 0,
            attempts: attempt.attemptNumber,
          }).catch((err) => {
            console.error('Failed to record attempt:', err);
            // Continue with other attempts even if one fails
          });
        }
      }
    } catch (err) {
      console.error('Error logging attempts:', err);
      // Continue to summary screen even if logging fails
    } finally {
      router.replace({
        pathname: routeBuilders.sessionSummary(sessionId),
        params: { kind: sessionKind, lessonId },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
        <SessionRunner plan={plan} onComplete={handleComplete} />
      )}
    </SafeAreaView>
  );
}
