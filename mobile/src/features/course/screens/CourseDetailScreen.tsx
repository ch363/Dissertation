import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getModule, getModuleLessons, type Module, type Lesson } from '@/services/api/modules';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { makeSessionId } from '@/features/session/sessionBuilder';
import { preloadSessionPlan } from '@/services/api/session-plan-cache';

export default function CourseDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme: appTheme } = useAppTheme();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    const loadModule = async () => {
      if (!slug) {
        setError('Course slug is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Convert slug to title format (e.g., "basics" -> "Basics")
        const normalizedSlug = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        const moduleData = await getModule(normalizedSlug);
        setModule(moduleData);
        
        // Fetch all lessons for this module
        try {
          const lessonsData = await getModuleLessons(moduleData.id);
          console.log('Loaded lessons:', lessonsData.length, lessonsData);
          setLessons(lessonsData);
          
          // Preload all lesson session plans in the background
          // This happens silently while user views the lesson list
          // Stagger the requests slightly to avoid overwhelming the network
          lessonsData.forEach((lesson, index) => {
            // Small delay to stagger requests (50ms between each)
            setTimeout(() => {
              preloadSessionPlan(lesson.id).catch((error) => {
                // Silently fail - preloading is best effort
                console.debug('Preload failed for lesson', lesson.id, '(non-critical):', error);
              });
            }, index * 50);
          });
        } catch (lessonErr) {
          console.error('Failed to load lessons:', lessonErr);
          // Continue without lesson data
        }
      } catch (err: any) {
        console.error('Failed to load module:', err);
        setError(err?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [slug]);

  // Update navigation title and add home button when module is loaded
  useLayoutEffect(() => {
    if (module) {
      const handleHomePress = () => {
        // Dismiss all modals/stacks to reveal the home screen underneath
        router.dismissAll();
        // Navigate to home - this will slide the current screen right, revealing home underneath
        // Using navigate instead of replace to get the stack animation
        router.navigate(routes.tabs.home);
      };

      navigation.setOptions({
        title: module.title,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Home"
            onPress={handleHomePress}
            hitSlop={12}
            style={styles.homeButton}
          >
            <Ionicons name="home" size={22} color={appTheme.colors.mutedText} />
          </Pressable>
        ),
      });
    }
  }, [module, navigation, appTheme.colors.mutedText, router]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (error || !module) {
    return (
      <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <Text style={[styles.errorText, { color: appTheme.colors.error }]}>
          {error || 'Course not found'}
        </Text>
      </View>
    );
  }

  // Use module title and description for the header
  const displayTitle = module.title;
  const displayDescription = module.description || 'A tailored course based on your onboarding preferences.';
  
  // Calculate total items across all lessons
  const totalItems = lessons.reduce((sum, lesson) => sum + (lesson.numberOfItems || 0), 0);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: appTheme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '15' }]}>
          <Ionicons name="book" size={48} color={appTheme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: appTheme.colors.text }]}>{displayTitle}</Text>
        <Text style={[styles.subtitle, { color: appTheme.colors.mutedText }]}>
          {displayDescription}
        </Text>
      </View>

      {/* Stats Section */}
      {lessons.length > 0 && (
        <View style={[styles.statsCard, { backgroundColor: appTheme.colors.card }]}>
          <View style={styles.statItem}>
            <Ionicons name="list" size={20} color={appTheme.colors.primary} />
            <Text style={[styles.statText, { color: appTheme.colors.text }]}>
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={appTheme.colors.primary} />
            <Text style={[styles.statText, { color: appTheme.colors.text }]}>
              ~{Math.ceil(totalItems * 1.5)} min
            </Text>
          </View>
        </View>
      )}

      {/* Lessons List Section */}
      {lessons.length > 0 ? (
        <View style={styles.lessonsSection}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>
            Lessons
          </Text>
          <View style={styles.lessonsList}>
            {lessons.map((lesson, index) => {
              const handleLessonPress = () => {
                const sessionId = makeSessionId('learn');
                router.push({
                  pathname: routeBuilders.sessionDetail(sessionId),
                  params: { lessonId: lesson.id, kind: 'learn' },
                });
              };

              const handleLessonPressIn = () => {
                // Start preloading the session plan when user presses down
                preloadSessionPlan(lesson.id).catch((error) => {
                  // Silently fail - preloading is best effort
                  console.debug('Preload failed (non-critical):', error);
                });
              };

              return (
              <Pressable
                key={lesson.id}
                style={[styles.lessonCard, { backgroundColor: appTheme.colors.card }]}
                onPress={handleLessonPress}
                onPressIn={handleLessonPressIn}
              >
                <View style={styles.lessonCardContent}>
                  <View style={styles.lessonCardLeft}>
                    <View style={[styles.lessonNumber, { backgroundColor: appTheme.colors.primary + '15' }]}>
                      <Text style={[styles.lessonNumberText, { color: appTheme.colors.primary }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.lessonCardText}>
                      <Text style={[styles.lessonTitle, { color: appTheme.colors.text }]}>
                        {lesson.title}
                      </Text>
                      {lesson.description && (
                        <Text style={[styles.lessonDescription, { color: appTheme.colors.mutedText }]} numberOfLines={1}>
                          {lesson.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.lessonCardRight}>
                    <Text style={[styles.lessonStats, { color: appTheme.colors.mutedText }]}>
                      {lesson.numberOfItems || 0} items
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={appTheme.colors.mutedText} />
                  </View>
                </View>
              </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: appTheme.colors.mutedText }]}>
            No lessons available yet
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: theme.spacing.md,
  },
  statText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 18,
    marginBottom: theme.spacing.md,
  },
  lessonsSection: {
    marginBottom: theme.spacing.xl,
  },
  lessonsList: {
    gap: theme.spacing.md,
  },
  lessonCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberText: {
    fontFamily: theme.typography.bold,
    fontSize: 16,
  },
  lessonCardText: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    marginBottom: theme.spacing.xs,
  },
  lessonDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
  },
  lessonCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  lessonStats: {
    fontFamily: theme.typography.regular,
    fontSize: 12,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: theme.spacing.sm,
  },
  primary: { backgroundColor: theme.colors.primary },
  buttonIcon: {
    marginRight: -4,
  },
  buttonText: { 
    color: '#fff', 
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
  homeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
});
