import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';

import { PrimaryButton } from './_components';

import { getCurrentUser } from '@/app/api/auth';
import { saveOnboarding } from '@/app/api/onboarding';
import { useOnboarding } from '@/features/onboarding/providers/OnboardingProvider';
import { routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function OnboardingCompletion() {
  const { answers, reset } = useOnboarding();
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    try {
      setSaving(true);
      const user = await getCurrentUser();
      if (user) {
        await saveOnboarding(user.id, answers);
      }
      reset();
      router.replace(routes.tabs.home);
    } catch (e: any) {
      Alert.alert(
        'Save failed',
        e?.message || 'Could not save your onboarding yet. We will retry in the background.',
      );
      router.replace(routes.tabs.home);
    } finally {
      setSaving(false);
    }
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
