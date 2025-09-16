import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

import { theme } from '@/theme';

export default function Gamification() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.gamification ?? null;

  const options = [
    { key: 'light', icon: '🎯', label: 'Light gamification (streaks, stars)' },
    { key: 'none', icon: '🚫', label: 'No gamification' },
    { key: 'full', icon: '🏆', label: 'Lots of challenges & rewards' },
  ];

  const onNext = () => router.push('/onboarding/feedback-style');
  const onSkip = () => router.push('/onboarding/feedback-style');

  return (
    <View style={styles.container}>
      <Stepper current={5} total={9} />
      <Text style={styles.title}>Gamification preference</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected === o.key}
          onPress={() => setAnswerAndSave('gamification', o.key)}
          icon={o.icon}
        />
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
