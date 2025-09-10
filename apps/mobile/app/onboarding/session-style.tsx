import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

export default function SessionStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.sessionStyle ?? null;

  const options = [
    { key: 'short', icon: '⏱️', label: 'Short bursts (5–10 min)' },
    { key: 'focused', icon: '🎯', label: 'Focused blocks (20–30 min)' },
    { key: 'deep', icon: '🧠', label: 'Deep sessions (45+ min)' },
  ];

  const onNext = () => router.push('/onboarding/tone');
  const onSkip = () => router.push('/onboarding/tone');

  return (
    <View style={styles.container}>
      <Stepper current={7} total={9} />
      <Text style={styles.title}>Session style</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setAnswerAndSave('sessionStyle', o.key)} icon={o.icon} />
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
