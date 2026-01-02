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

export default function MemoryHabits() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.memoryHabit ?? null;

  const options = [
    { key: 'spaced', icon: '🗓️', label: 'Spaced repetition (flashcards, reviews)' },
    { key: 'mnemonics', icon: '🧠', label: 'Mnemonics & stories' },
    { key: 'immersion', icon: '🌍', label: 'Context & immersion' },
    { key: 'writing', icon: '📝', label: 'Rewriting and note-taking' },
  ];

  const onNext = () => router.push('/onboarding/4_difficulty');
  const onSkip = () => router.push('/onboarding/4_difficulty');

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
      <Stepper current={3} total={9} />
      <Text style={styles.title}>How do you usually remember best?</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected === o.key}
          onPress={() => setAnswerAndSave('memoryHabit', o.key)}
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
