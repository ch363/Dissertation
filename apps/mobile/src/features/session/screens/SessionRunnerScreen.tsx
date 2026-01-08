import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionRunner } from '@/features/session/components/SessionRunner';
import {
  buildLessonSessionPlan,
  buildReviewSessionPlan,
  makeSessionId,
} from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { SessionKind } from '@/types/session';

export default function SessionRunnerScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    lessonId?: string;
    kind?: string;
  }>();

  const sessionId = (params.sessionId as string | undefined) ?? makeSessionId('session');
  const sessionKind: SessionKind = params.kind === 'review' ? 'review' : 'learn';
  const lessonId = (params.lessonId as string | undefined) ?? 'demo';

  const plan = useMemo(
    () =>
      sessionKind === 'review'
        ? buildReviewSessionPlan(sessionId)
        : buildLessonSessionPlan(lessonId),
    [lessonId, sessionId, sessionKind],
  );

  const handleComplete = () => {
    router.replace({
      pathname: routeBuilders.sessionSummary(sessionId),
      params: { kind: sessionKind, lessonId },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SessionRunner plan={plan} onComplete={handleComplete} />
    </SafeAreaView>
  );
}
