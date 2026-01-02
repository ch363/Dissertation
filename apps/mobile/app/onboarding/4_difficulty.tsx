import { router } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';

import {
  Stepper,
  Option,
  PrimaryButton,
  StickyCTA,
  WhyWeAskLink,
  QuestionScreen,
} from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

import { theme } from '@/theme';

export default function Difficulty() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.difficulty ?? null;

  const options = [
    { key: 'easy', icon: '🙂', label: 'Keep it easy' },
    { key: 'balanced', icon: '⚖️', label: 'Balanced challenge' },
    { key: 'hard', icon: '🔥', label: 'Push me hard' },
  ];

  const onNext = () => router.push('/onboarding/5_gamification');
  const onSkip = () => router.push('/onboarding/5_gamification');

  return (
    <QuestionScreen
      footer={
        <StickyCTA>
          <PrimaryButton title="Next" onPress={onNext} disabled={!selected} />
          <View style={{ height: 8 }} />
          <PrimaryButton title="Skip / Not sure" onPress={onSkip} />
        </StickyCTA>
      }
    >
      <Stepper current={4} total={9} />
      <Text style={styles.title}>Preferred difficulty</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected === o.key}
          onPress={() => setAnswerAndSave('difficulty', o.key)}
          icon={o.icon}
        />
      ))}
    </QuestionScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  // next button styles moved to shared components
});
