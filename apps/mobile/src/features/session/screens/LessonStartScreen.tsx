import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildLessonSessionPlan, makeSessionId } from '@/features/session/sessionBuilder';
import { routeBuilders } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function LessonStartScreen() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = (params.lessonId as string | undefined) ?? 'demo';

  const sessionId = useMemo(() => makeSessionId('learn'), []);
  const planPreview = useMemo(() => buildLessonSessionPlan(lessonId), [lessonId]);

  const handleStart = () => {
    router.push({
      pathname: routeBuilders.sessionDetail(sessionId),
      params: { lessonId, kind: 'learn' },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>{planPreview.title}</Text>
        <Text style={styles.subtitle}>
          {planPreview.cards.length} cards • Mix of teach and practice cards
        </Text>
        <Pressable style={styles.primary} onPress={handleStart}>
          <Text style={styles.primaryLabel}>Start session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
});
