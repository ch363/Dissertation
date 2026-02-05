import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentContinueButton, LoadingScreen } from '@/components/ui';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';
import { getCurrentUser } from '@/services/api/auth';
import { saveOnboarding } from '@/services/api/onboarding';
import { createLogger } from '@/services/logging';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';

const logger = createLogger('OnboardingCompletion');

export default function OnboardingCompletion() {
  const { theme } = useAppTheme();
  const { answers, reset } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (hasSaved) return;

    const hasAnswers = !!answers && Object.keys(answers).length > 0;
    if (!hasAnswers) {
      logger.warn('No answers found, redirecting to welcome');
      router.replace('/(onboarding)/welcome');
    }
  }, [answers, hasSaved]);

  async function saveWithRetry(userId: string, maxAttempts = 3): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await saveOnboarding(userId, answers);
        return;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;
        logger.warn(`Save attempt ${attempt}/${maxAttempts} failed`, { error: err.message });
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

      await saveWithRetry(user.id);
      logger.info('Successfully saved onboarding');

      setHasSaved(true);
      reset();

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        logger.info('Navigating to home');
        router.replace(routes.tabs.home);
      } catch (navError: unknown) {
        const err = navError instanceof Error ? navError : new Error(String(navError));
        logger.error('Navigation error', err);
        router.replace('/');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error saving onboarding', err);
      const message =
        err.message || 'Could not save. Check your connection and that the backend is running.';
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.headline, { color: theme.colors.text }]}>
          Thanks for completing the setup
        </Text>
        <Text style={[styles.subtext, { color: theme.colors.mutedText }]}>
          We’ll use your answers to tailor Fluentia to your goals and learning style.
        </Text>
        {saving ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <ContentContinueButton title="Continue" onPress={onContinue} style={styles.cta} />
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
  },
});
