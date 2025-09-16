import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/theme';
import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

export default function Difficulty() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.difficulty ?? null;

  const options = [
    { key: 'easy', icon: '🙂', label: 'Keep it easy' },
    { key: 'balanced', icon: '⚖️', label: 'Balanced challenge' },
    { key: 'hard', icon: '🔥', label: 'Push me hard' },
  ];

  const onNext = () => router.push('/onboarding/gamification');
  const onSkip = () => router.push('/onboarding/gamification');

  return (
    <View style={styles.container}>
      <Stepper current={4} total={9} />
      <Text style={styles.title}>Preferred difficulty</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setAnswerAndSave('difficulty', o.key)} icon={o.icon} />
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
