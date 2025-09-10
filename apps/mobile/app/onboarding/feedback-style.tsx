import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

export default function FeedbackStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.feedback ?? null;

  const options = [
    { key: 'gentle', icon: '🌤️', label: 'Gentle encouragement' },
    { key: 'direct', icon: '🧭', label: 'Direct and corrective' },
    { key: 'detailed', icon: '🔍', label: 'Detailed explanations' },
  ];

  const onNext = () => router.push('/onboarding/session-style');
  const onSkip = () => router.push('/onboarding/session-style');

  return (
    <View style={styles.container}>
      <Stepper current={6} total={9} />
      <Text style={styles.title}>Feedback style</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setAnswerAndSave('feedback', o.key)} icon={o.icon} />
      ))}
      <StickyCTA>
        <PrimaryButton title="Next" onPress={onNext} disabled={!selected} />
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
