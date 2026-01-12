import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionRunner } from '@/features/session/components/SessionRunner';
import { buildReviewSessionPlan, makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { AttemptLog, SessionKind, SessionPlan } from '@/types/session';

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

  // TODO: Replace with new API business layer
  // All learning API calls have been removed - screens are ready for new implementation

  useEffect(() => {
    if (sessionKind === 'review') {
      setPlan(buildReviewSessionPlan(sessionId));
      setLoading(false);
      return;
    }
    // For 'learn' sessions, plan will need to be set via new API
    setLoading(false);
    setError('Learning sessions require new API implementation');
  }, [lessonId, sessionId, sessionKind]);

  const handleComplete = async (attempts: AttemptLog[]) => {
    // TODO: Replace with new API business layer for logging
    try {
      // Logging functionality removed - implement with new API
    } catch {
      // ignore logging errors
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.error} />
        </View>
      ) : (
        <SessionRunner plan={plan} onComplete={handleComplete} />
      )}
    </SafeAreaView>
  );
}
