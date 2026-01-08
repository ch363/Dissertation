import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContinueLearningCard } from '@/components/learn/ContinueLearningCard';
import { DiscoverCarousel } from '@/components/learn/DiscoverCarousel';
import { LearnHeader } from '@/components/learn/LearnHeader';
import { LearningPathCarousel } from '@/components/learn/LearningPathCarousel';
import { ReviewSection } from '@/components/learn/ReviewSection';
import { learnMock } from '@/features/learn/mock';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function LearnScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: baseTheme.spacing.xl }}
      >
        <LearnHeader />
        <ContinueLearningCard data={learnMock.continueLesson} />
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
        <LearningPathCarousel items={learnMock.learningPath} />
        <ReviewSection
          data={learnMock.review}
          onStart={() => router.push('/(tabs)/learn/review')}
        />
        <DiscoverCarousel items={learnMock.discover} />
        <View style={{ height: baseTheme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
