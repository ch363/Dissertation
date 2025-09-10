import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { theme } from '../../src/theme';

export default function MotivationGoals() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.motivation?.key ?? null;

  const options = [
    { key: 'travel', icon: '🛫', label: 'For travel' },
    { key: 'family', icon: '👨‍👩‍👧', label: 'To connect with family/friends' },
    { key: 'study', icon: '🎓', label: 'For study/career' },
    { key: 'fun', icon: '🎮', label: 'For fun/personal growth' },
  ];

  const onNext = () => {
    // Already saved on selection; proceed
    router.push('/onboarding/preferred-learning');
  };
  const onSkip = () => {
    router.push('/onboarding/preferred-learning');
  };

  return (
    <View style={styles.container}>
      <Stepper current={1} total={9} />
      <Text style={styles.title}>Motivation & Goals</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected === o.key}
          onPress={() => {
            setAnswerAndSave('motivation', { key: o.key });
          }}
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
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  // next button styles moved to shared components
});
