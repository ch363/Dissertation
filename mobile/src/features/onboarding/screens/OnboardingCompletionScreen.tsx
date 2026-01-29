import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui';
import { getCurrentUser } from '@/services/api/auth';
import { saveOnboarding } from '@/services/api/onboarding';
import { PrimaryButton } from '@/components/onboarding/_components';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
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
  const { theme: appTheme } = useAppTheme();
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

  async function saveWithRetry(
    userId: string,
    maxAttempts = 3,
  ): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await saveOnboarding(userId, answers);
        return;
      } catch (e: any) {
        lastError = e;
        console.warn(`OnboardingCompletion: Save attempt ${attempt}/${maxAttempts} failed`, e?.message);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
    throw lastError ?? new Error('Save failed after retries');
  }

  async function onContinue() {
    try {
      setSaving(true);
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No user found. Please sign in again.');
      }

      // All onboarding fields are optional - skipped steps are valid
      await saveWithRetry(user.id);
      console.log('OnboardingCompletion: Successfully saved onboarding');

      setHasSaved(true);
      reset();

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        console.log('OnboardingCompletion: Navigating to home');
        router.replace(routes.tabs.home);
      } catch (navError: any) {
        console.error('OnboardingCompletion: Navigation error', navError);
        router.replace('/');
      }
    } catch (e: any) {
      console.error('OnboardingCompletion: Error saving onboarding', e);
      const message =
        e?.message ||
        'Could not save. Check your connection and that the backend is running.';
      const buttons = [
        { text: 'Try Again', onPress: () => onContinue() },
        {
          text: 'Continue Anyway',
          style: 'cancel' as const,
          onPress: () => {
            try {
              router.replace(routes.tabs.home);
            } catch {
              router.replace('/');
            }
          },
        },
      ];
      Alert.alert('Save failed', message, buttons);
    } finally {
      setSaving(false);
    }
  }

  // Don't render if no answers (will redirect in useEffect)
  // Unless we've already saved, in which case we're navigating away
  const hasAnswers = answers && Object.keys(answers).length > 0;
  if (!hasAnswers && !hasSaved) {
    return (
      <LoadingScreen
        title="Loading..."
        subtitle="Please wait while we load your setup."
        safeArea={false}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: appTheme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.headline, { color: appTheme.colors.text }]}>Thanks for completing the setup</Text>
      <Text style={[styles.subtext, { color: appTheme.colors.mutedText }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
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
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
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
