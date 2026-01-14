import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';

import { getCurrentUser } from '@/services/api/auth';
import { saveOnboarding } from '@/services/api/onboarding';
import { PrimaryButton } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';
import { routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

type StepRequirement = {
  key: string;
  path: string;
  isComplete: (answers: Record<string, any>) => boolean;
};

const REQUIRED_STEPS: StepRequirement[] = [
  {
    key: 'motivation',
    path: '/(onboarding)/1_motivation-goals',
    isComplete: (answers) => !!answers.motivation?.key,
  },
  {
    key: 'learningStyles',
    path: '/(onboarding)/2_preferred-learning',
    isComplete: (answers) =>
      Array.isArray(answers.learningStyles) && answers.learningStyles.length > 0,
  },
  {
    key: 'memoryHabit',
    path: '/(onboarding)/3_memory-habits',
    isComplete: (answers) => !!answers.memoryHabit,
  },
  {
    key: 'difficulty',
    path: '/(onboarding)/4_difficulty',
    isComplete: (answers) => !!answers.difficulty,
  },
  {
    key: 'gamification',
    path: '/(onboarding)/5_gamification',
    isComplete: (answers) => !!answers.gamification,
  },
  {
    key: 'feedback',
    path: '/(onboarding)/6_feedback-style',
    isComplete: (answers) => !!answers.feedback,
  },
  {
    key: 'sessionStyle',
    path: '/(onboarding)/7_session-style',
    isComplete: (answers) => !!answers.sessionStyle,
  },
  {
    key: 'tone',
    path: '/(onboarding)/8_tone',
    isComplete: (answers) => !!answers.tone,
  },
  {
    key: 'experience',
    path: '/(onboarding)/9_experience-level',
    isComplete: (answers) => !!answers.experience,
  },
];

export default function OnboardingCompletion() {
  const { answers, reset } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Redirect to welcome if user somehow accessed this screen without any answers
  // Skip redirect if we've already saved and are navigating away
  // Note: All onboarding fields are optional, so skipped steps are valid
  useEffect(() => {
    if (hasSaved) return; // Don't redirect after successful save
    
    const hasAnswers = !!answers && Object.keys(answers).length > 0;
    if (!hasAnswers) {
      console.warn('OnboardingCompletion: No answers found, redirecting to welcome');
      router.replace('/(onboarding)/welcome');
      return;
    }
    // Removed validation for incomplete steps - all fields are optional, skipped steps are valid
  }, [answers, hasSaved]);

  async function onContinue() {
    try {
      setSaving(true);
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No user found. Please sign in again.');
      }

      // All onboarding fields are optional - skipped steps are valid
      // Save whatever answers we have (including skipped/null values)
      await saveOnboarding(user.id, answers);
      console.log('OnboardingCompletion: Successfully saved onboarding');
      
      setHasSaved(true); // Mark as saved before reset to prevent useEffect redirect
      reset();

      // Small delay to ensure backend has processed the save
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to home with error handling
      try {
        console.log('OnboardingCompletion: Navigating to home');
        router.replace(routes.tabs.home);
      } catch (navError: any) {
        console.error('OnboardingCompletion: Navigation error', navError);
        // Fallback: try navigating to root and let RouteGuard handle it
        router.replace('/');
      }
    } catch (e: any) {
      console.error('OnboardingCompletion: Error saving onboarding', e);
      Alert.alert(
        'Save failed',
        e?.message || 'Could not save your onboarding yet. We will retry in the background.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              // Retry saving
              onContinue();
            },
          },
          {
            text: 'Continue Anyway',
            style: 'cancel',
            onPress: () => {
              // Navigate to home even if save failed
              try {
                router.replace(routes.tabs.home);
              } catch {
                router.replace('/');
              }
            },
          },
        ],
      );
    } finally {
      setSaving(false);
    }
  }

  // Don't render if no answers (will redirect in useEffect)
  // Unless we've already saved, in which case we're navigating away
  const hasAnswers = answers && Object.keys(answers).length > 0;
  if (!hasAnswers && !hasSaved) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.headline}>Thanks for completing the setup</Text>
      <Text style={styles.subtext}>
        We’ll use your answers to tailor Fluentia to your goals and learning style.
      </Text>
      {saving ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <PrimaryButton
          title="Continue"
          onPress={onContinue}
          style={styles.cta}
          textStyle={styles.ctaText}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
  },
  headline: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  cta: {
    width: '100%',
    borderRadius: 20,
  },
  ctaText: {
    fontSize: 18,
  },
});
