import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { getCurrentUser } from '../../src/lib/auth';
import { saveOnboarding } from '../../src/lib/onboardingRepo';

export default function ExperienceLevel() {
  const { setAnswerAndSave, answers } = useOnboarding();
  const selected = answers.experience ?? null;

  const options = [
    { key: 'beginner', icon: '🌱', label: 'Beginner' },
    { key: 'intermediate', icon: '🌿', label: 'Intermediate' },
    { key: 'advanced', icon: '🌳', label: 'Advanced' },
  ];

  const onFinish = async () => {
    setAnswerAndSave('experience', selected ?? '');
  try {
      const user = await getCurrentUser();
      if (user) {
        await saveOnboarding(user.id, { ...answers, experience: selected ?? '' });
      }
  } catch {}
  router.replace('/onboarding/completion');
  };
  const onSkip = () => router.replace('/onboarding/completion');

  return (
    <View style={styles.container}>
      <Stepper current={9} total={9} />
      <Text style={styles.title}>What’s your experience level?</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => { setAnswerAndSave('experience', o.key); }} icon={o.icon} />
      ))}
      <StickyCTA>
        <PrimaryButton title="Finish" onPress={onFinish} disabled={!selected} />
        <View style={{ height: 8 }} />
        <PrimaryButton title="Skip / Not sure" onPress={onSkip} />
      </StickyCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  // next button styles moved to shared components
});
