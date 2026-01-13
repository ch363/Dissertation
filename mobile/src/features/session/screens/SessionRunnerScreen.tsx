import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionRunner } from '@/features/session/components/SessionRunner';
import { buildReviewSessionPlan, makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { AttemptLog, SessionKind, SessionPlan } from '@/types/session';
import { getSessionPlan } from '@/services/api/learn';
import { recordQuestionAttempt } from '@/services/api/progress';

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

  // Use props if provided (for direct component usage), otherwise use route params
  const sessionId =
    props?.sessionId ?? (params.sessionId as string | undefined) ?? makeSessionId('session');
  const sessionKind: SessionKind = props?.kind ?? (params.kind === 'review' ? 'review' : 'learn');
  const lessonId = props?.lessonId ?? (params.lessonId as string | undefined) ?? 'demo';

  const { theme } = useAppTheme();
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessionPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        if (sessionKind === 'review') {
          // For review sessions, use the review session plan builder
          // TODO: Replace with backend session-plan endpoint when review mode is supported
          setPlan(buildReviewSessionPlan(sessionId));
          setLoading(false);
          return;
        }

        // For learn sessions, fetch from backend
        if (lessonId && lessonId !== 'demo') {
          const planData = await getSessionPlan({
            mode: 'learn',
            lessonId,
          });
          
          // Transform backend session plan to frontend SessionPlan format
          // Note: This assumes the backend returns a compatible format
          // If not, we'll need to add transformation logic here
          if (planData && planData.cards) {
            setPlan({
              id: sessionId,
              kind: 'learn',
              lessonId,
              title: planData.title || `Lesson ${lessonId}`,
              cards: planData.cards || [],
            });
          } else {
            setError('Unable to load session plan');
          }
        } else {
          setError('Lesson ID is required');
        }
      } catch (err: any) {
        console.error('Failed to load session plan:', err);
        setError(err?.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSessionPlan();
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
