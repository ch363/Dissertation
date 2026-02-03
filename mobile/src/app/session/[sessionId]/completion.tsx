import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { routeBuilders } from '@/services/navigation/routes';

/**
 * Completion route redirects to the standard session summary screen
 * so all completion flows use the same screen (SessionSummaryScreen).
 */
export default function CompletionRedirect() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    kind?: string;
    lessonId?: string;
    planMode?: string;
    timeBudgetSec?: string;
    returnTo?: string;
    totalXp?: string;
    teachingsMastered?: string;
  }>();

  useEffect(() => {
    const sessionId = params.sessionId;
    if (!sessionId) return;
    router.replace({
      pathname: routeBuilders.sessionSummary(sessionId),
      params: {
        kind: params.kind,
        lessonId: params.lessonId,
        planMode: params.planMode,
        timeBudgetSec: params.timeBudgetSec,
        returnTo: params.returnTo,
        totalXp: params.totalXp,
        teachingsMastered: params.teachingsMastered,
      },
    });
  }, [params.sessionId, params.kind, params.lessonId, params.planMode, params.timeBudgetSec, params.returnTo, params.totalXp, params.teachingsMastered]);

  return <View />;
}
