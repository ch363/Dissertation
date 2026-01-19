import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { routeBuilders } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function CompletionScreen() {
  const params = useLocalSearchParams<{ 
    sessionId?: string; 
    kind?: string; 
    lessonId?: string;
    planMode?: string;
    timeBudgetSec?: string;
    totalXp?: string;
    teachingsMastered?: string;
  }>();
  const sessionId = params.sessionId;
  const kind = params.kind === 'review' ? 'review' : 'learn';
  const lessonId = params.lessonId;
  const planMode = params.planMode;
  const timeBudgetSec = params.timeBudgetSec;

  // Get stats from route params (calculated in SessionRunner)
  const stats = useMemo(() => {
    const totalXp = params.totalXp ? parseInt(params.totalXp, 10) : 0;
    const teachingsMastered = params.teachingsMastered ? parseInt(params.teachingsMastered, 10) : 0;

    return {
      totalXp,
      teachingsMastered,
    };
  }, [params.totalXp, params.teachingsMastered]);

  const handleContinue = () => {
    if (sessionId) {
      router.replace({
        pathname: routeBuilders.sessionSummary(sessionId),
        params: { kind, lessonId, planMode, timeBudgetSec },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="trophy" size={64} color={theme.colors.primary} />
            <Text style={styles.title}>Session Complete!</Text>
            <Text style={styles.subtitle}>
              Great work! Here's what you accomplished:
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalXp}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="book" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.teachingsMastered}</Text>
              <Text style={styles.statLabel}>
                {stats.teachingsMastered === 1 ? 'Teaching' : 'Teachings'} Mastered
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonLabel}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  statIconContainer: {
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
