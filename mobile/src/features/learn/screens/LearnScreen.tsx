import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';

import { ContinueLearningCard } from '@/components/learn/ContinueLearningCard';
import { DiscoverCarousel } from '@/components/learn/DiscoverCarousel';
import { LearnHeader } from '@/components/learn/LearnHeader';
import { LearningPathCarousel } from '@/components/learn/LearningPathCarousel';
import { ReviewSection } from '@/components/learn/ReviewSection';
import { ContinueLesson, DiscoverCard, learnMock } from '@/features/learn/mock';
import { getSuggestions } from '@/services/api/learn';
import { getRecentActivity } from '@/services/api/profile';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function LearnScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [continueLesson, setContinueLesson] = useState<ContinueLesson | null>(null);
  const [discoverItems, setDiscoverItems] = useState<DiscoverCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recentActivity, suggestions] = await Promise.all([
        getRecentActivity().catch(() => null),
        getSuggestions({ limit: 8 }).catch(() => ({ lessons: [], modules: [] })),
      ]);

      // Transform recentActivity to ContinueLesson
      if (recentActivity?.recentLesson) {
        const recent = recentActivity.recentLesson;
        const totalTeachings = recent.totalTeachings ?? (recent.completedTeachings || 1);
        const progress = totalTeachings > 0 ? recent.completedTeachings / totalTeachings : 0;
        const progressLabel = `${recent.completedTeachings}/${totalTeachings} complete`;
        
        // Estimate minutes away based on remaining teachings (assuming ~2 min per teaching)
        const remainingTeachings = Math.max(0, totalTeachings - recent.completedTeachings);
        const minutesAway = Math.max(1, Math.ceil(remainingTeachings * 2));

        setContinueLesson({
          courseTitle: recent.lesson.module.title,
          lessonTitle: recent.lesson.title,
          minutesAway,
          progressLabel,
          progress: Math.min(1, Math.max(0, progress)),
        });
      } else {
        setContinueLesson(null);
      }

      // Transform suggestions to DiscoverCard[]
      const discoverCards: DiscoverCard[] = [];
      const backgroundColors = ['#DFF2FF', '#FFF4DA', '#EAF0FF', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
      
      // Add lesson suggestions
      suggestions.lessons.forEach((lessonSuggestion, index) => {
        discoverCards.push({
          id: lessonSuggestion.lesson.id,
          title: lessonSuggestion.lesson.title,
          subtitle: lessonSuggestion.reason || 'Continue your learning journey',
          background: backgroundColors[index % backgroundColors.length],
        });
      });

      // Add module suggestions
      suggestions.modules.forEach((moduleSuggestion, index) => {
        discoverCards.push({
          id: moduleSuggestion.module.id,
          title: moduleSuggestion.module.title,
          subtitle: moduleSuggestion.reason || 'Explore new content',
          background: backgroundColors[(suggestions.lessons.length + index) % backgroundColors.length],
        });
      });

      setDiscoverItems(discoverCards);
    } catch (error) {
      console.error('Error loading learn screen data:', error);
      // Gracefully handle errors - don't block UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.mutedText }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: baseTheme.spacing.xl }}
      >
        <LearnHeader />
        {continueLesson && <ContinueLearningCard data={continueLesson} />}
        <LearningPathCarousel items={learnMock.learningPath} />
        <ReviewSection
          data={learnMock.review}
          onStart={() => router.push('/(tabs)/learn/review')}
        />
        {discoverItems.length > 0 && <DiscoverCarousel items={discoverItems} />}
        <View style={{ height: baseTheme.spacing.xl }} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/learn/list')}
          style={({ pressed }) => [
            styles.listCta,
            {
              borderColor: theme.colors.border,
              backgroundColor: pressed ? '#f2f6ff' : '#fff',
            },
          ]}
        >
          <View style={styles.listCtaHeader}>
            <Text style={[styles.listTitle, { color: theme.colors.text }]}>Browse all lessons</Text>
            <Text style={[styles.listLink, { color: theme.colors.primary }]}>View</Text>
          </View>
          <Text style={[styles.listSubtitle, { color: theme.colors.mutedText }]}>
            Jump into A1 lessons and overviews
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  loadingText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  listCta: {
    marginTop: baseTheme.spacing.lg,
    marginHorizontal: baseTheme.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  listCtaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  listLink: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  listSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
});
